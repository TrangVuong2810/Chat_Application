package com.chat.chat.service.chat;

import com.chat.chat.dto.*;
import com.chat.chat.enums.UserState;
import com.chat.chat.mapper.ConversationMapper;
import com.chat.chat.mapper.MessageMapper;
import com.chat.chat.model.Conversation;
import com.chat.chat.model.Message;
import com.chat.chat.model.User;
import com.chat.chat.payload.request.MessageRequest;
import com.chat.chat.payload.response.ConversationResponse;
import com.chat.chat.payload.response.MessageResponse;
import com.chat.chat.repository.ChatMessageRepository;
import com.chat.chat.repository.ConversationRepository;
import com.chat.chat.repository.UserRepository;
import com.chat.chat.service.UserSocketService;
import com.chat.chat.service.conversation.ConversationService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Service;

import java.security.Principal;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Slf4j
@Service
public class ChatService implements IChatService {
    private final ConversationRepository conversationRepository;
    private final ConversationService conversationService;
    private final ChatMessageRepository messageRepository;
    private final ConversationMapper conversationMapper;
    private final SimpMessagingTemplate simpMessagingTemplate;
    private final UserSocketService userSocketService;
    private final UserRepository userRepository;


    @Override
    public List<OnlineUserDto> fetchOnlineUsers() {

        List<User> onlineUsers = userRepository.getOnlineUsersExceptThis();

        return onlineUsers
                .stream()
                .map(MessageMapper.INSTANCE::toDto)
                .toList();
    }

    @Override
    public List<ConversationDto> fetchConversations(String username) {
        List<Conversation> conversations = conversationRepository.findAllByUsername(username);

        return conversations
                .stream()
                .map(c -> MessageMapper.INSTANCE.toConversationDto(c, username))
                .toList();
    }

    @Override
    public void createAndSendConversation(List<User> users, StompHeaderAccessor accessor) {
        Conversation newConversation = conversationRepository.save(new Conversation(users));
        Principal senderPrincipal = Objects.requireNonNull(accessor.getUser());
        String senderUsername = Objects.requireNonNull(senderPrincipal.getName());
        simpMessagingTemplate.convertAndSend("/topic/conversation." + newConversation.getId(),
                "[" + getTimestamp() + "]:" + senderUsername + ":" + accessor.getMessage()
        );


    }
    private String getTimestamp() {
        Instant date = Instant.now();
        return date.toString();
    }

    @Override
    public void changeUserState(UserStateDto userStateDto, String username) {

    }

    @Override
    public MessageDto saveOrUpdateMessage(List<User> users, MessageDto message) {
        if(message.getStates() == null || message.getStates().isEmpty()){
            Message messageToSave = Message.builder()
                    .id(message.getId())
                    .content(message.getContent())
                    .conversation(conversationRepository.findById(UUID.fromString(message.getConversationId())).get())
                    .dateSent(Instant.now())
                    .states(null)
                    .build();
            messageRepository.save(messageToSave);
            return MessageMapper.INSTANCE.toDto(messageToSave);
        }
        return null;
    }

    @Override
    public PrevMessageDto fetchPreviousChat(UUID conversationId, int page, String currentUser) {
        return null;
    }

    @Transactional
    public void processPrivateMessage(MessageRequest messageRequest){
        UUID originalConversationId = messageRequest.getConversationId();

        MessageResponse savedMessage = conversationService.sendMessage(originalConversationId, messageRequest);
        if (savedMessage != null &&
                (savedMessage.getConversationId() == null ||
                        !savedMessage.getConversationId().equals(originalConversationId.toString()))) {
            log.info("Fixing incorrect conversationId in response");
            savedMessage.setConversationId(originalConversationId.toString());
        }
        String usernameSender = messageRequest.getUsername();
        sendToUser(usernameSender, savedMessage);
    }
    private void sendToUser(String sender, MessageResponse savedMessage) {
        UUID conversationId;
        try {
            conversationId = UUID.fromString(savedMessage.getConversationId());
        } catch (IllegalArgumentException e) {
            log.error("Invalid conversationId format in MessageResponse: {}", savedMessage.getConversationId());
            return; // Skip processing this message
        }
        Set<User> userDTOS = getUsersInConversation(conversationId);

        userDTOS.stream()
                .map(User::getUsername)
                .forEach(username -> {
                    log.info("Sending message to: " + username);
                    log.info("Message content: " + savedMessage); // Add this line
                    simpMessagingTemplate.convertAndSendToUser(username, "/private-messages", savedMessage);
                });
    }
    private void sendToSubscribers(String subscribersDestination, String destination, String loggedUser, Object payload) {
        userSocketService.getSubscribedSocketUsersByDestination(subscribersDestination)
                .stream()
                .map(UserStateDto::getUsername)
                .filter(name -> !loggedUser.equals(name))
                .forEach(subscriber -> simpMessagingTemplate.convertAndSendToUser(subscriber, destination, payload));
    }
    private Set<User> getUsersInConversation(UUID conversationId) {
        ConversationResponse conversation = conversationService.getConversationById(conversationId);
        if (conversation != null) {
            return new HashSet<>(conversation.getParticipants());
        }
        return new HashSet<>();
    }

    @SneakyThrows
    public void storeMessage(MessageRequest messageRequest){
        try {
            ConversationResponse conversation = conversationService.getConversationById(messageRequest.getConversationId());

            Message message = Message.builder()
                    .sender(userRepository.findByUsername(messageRequest.getUsername()))
                    .content(messageRequest.getContent())
                    .conversation(conversationMapper.mapConversationResponse(conversation))
                    .createdAt(Instant.now())
                    .dateSent(Instant.now())
                    .build();
            messageRepository.save(message);
            conversationService.sendMessage(messageRequest.getConversationId(),messageRequest);
        } catch (Exception ex) {
            ex.printStackTrace();
        }
    }


    public void broadcastOnlineUsers() {
        List<User> onlineUsers = userRepository.findAllByUserState(UserState.ONLINE);

        List<String> onlineUserIds = onlineUsers.stream()
                .map(user -> user.getId().toString())
                .collect(Collectors.toList());

        Map<String, Object> onlineUsersMessage = new HashMap<>();
        onlineUsersMessage.put("type", "ONLINE_USERS");
        onlineUsersMessage.put("metadata", Map.of("USERS", onlineUserIds));

        Set<String> connectedUsers = userSocketService.getConnectedUsernames();
        for (String connectedUsername : connectedUsers) {
            try {
                simpMessagingTemplate.convertAndSendToUser(
                        connectedUsername,
                        "/queue/messages",
                        onlineUsersMessage
                );
            } catch (Exception e) {
                log.error(e.getMessage());
            }
        }
    }

    public void broadcastConversationOnlineUsers(UUID conversationId) {
        ConversationResponse conversation = conversationService.getConversationById(conversationId);
        if (conversation == null || conversation.getParticipants().isEmpty()) {
            return;
        }

        // Filter participants who are online
        List<String> onlineUserIds = conversation.getParticipants().stream()
                .filter(user -> UserState.ONLINE.equals(user.getUserState()))
                .map(user -> user.getId().toString())
                .collect(Collectors.toList());

        Map<String, Object> onlineUsersMessage = new HashMap<>();
        onlineUsersMessage.put("type", "ONLINE_USERS");
        onlineUsersMessage.put("metadata", Map.of("USERS", onlineUserIds.toString()));

        // Send to all conversation participants who are connected
        for (User participant : conversation.getParticipants()) {
            try {
                // Only send to users who have active WebSocket connections
                if (userSocketService.findUserSocketByUsername(participant.getUsername()) != null) {
                    simpMessagingTemplate.convertAndSendToUser(
                            participant.getUsername(),
                            "/queue/messages",
                            onlineUsersMessage
                    );
                }
            } catch (Exception e) {
                log.error(e.getMessage());
            }
        }
    }
}
