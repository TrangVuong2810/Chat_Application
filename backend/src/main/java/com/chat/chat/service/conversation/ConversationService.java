package com.chat.chat.service.conversation;

import com.chat.chat.enums.MessageState;
import com.chat.chat.mapper.ChatMessageMapper;
import com.chat.chat.mapper.ConversationMapper;
import com.chat.chat.mapper.UserMapper;
import com.chat.chat.model.Conversation;
import com.chat.chat.model.Message;
import com.chat.chat.model.User;
import com.chat.chat.payload.request.ConversationRequest;
import com.chat.chat.payload.request.MessageRequest;
import com.chat.chat.payload.response.ConversationResponse;
import com.chat.chat.payload.response.MessageResponse;
import com.chat.chat.repository.ChatMessageRepository;
import com.chat.chat.repository.ConversationRepository;
import com.chat.chat.service.user.UserService;
import jakarta.annotation.PostConstruct;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;

import java.lang.module.ResolutionException;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConversationService implements IConversationService {
    private static final Log log = LogFactory.getLog(ConversationService.class);
    private final ConversationRepository conversationRepository;
    private final UserService userService;
    private final ConversationMapper conversationMapper;
    private final ChatMessageMapper messageMapper;
    private final ChatMessageRepository chatMessageRepository;
    @Override
    public List<ConversationResponse> getAllConversations() {
        return conversationRepository.findAll().stream().map(conversationMapper).collect(Collectors.toList());
    }

    @Override
    public List<ConversationResponse> getAllConversationsByUserId(UUID userId) {
        User user = userService.findUserById(userId);
        if (user == null) {
            throw new IllegalArgumentException("User with ID " + userId + " not found");
        }
        var conversations = conversationRepository.findAllByUserId(userId);
        List<Conversation> processedConversations = new ArrayList<>();
        for(Conversation conversation : conversations){
            if (conversation.getParticipants() == null) {
                conversation.setParticipants(new ArrayList<>());
            } else {
                List<User> cleanedParticipants = conversation.getParticipants().stream()
                        .filter(Objects::nonNull)
                        .collect(Collectors.toList());
                conversation.setParticipants(cleanedParticipants);
            }

            if(conversation.getDateUpdate() == null){
                try {
                    List<MessageResponse> messageResponses = this.getMessages(String.valueOf(conversation.getId()));

                    if (!messageResponses.isEmpty()) {
                        MessageResponse lastMessage = messageResponses.get(messageResponses.size() - 1);
                        conversation.setDateUpdate(lastMessage.getDateSent());
                    } else {
                        conversation.setDateUpdate(Instant.now());
                    }
                } catch (Exception e) {
                    log.error("Error processing messages for conversation: " + conversation.getId(), e);
                    conversation.setDateUpdate(Instant.now());
                }

            }
            processedConversations.add(conversation);
        }

        if (processedConversations.isEmpty()) {
            return List.of();
        }

        for (Conversation conversation : processedConversations) {
            if (conversation.getParticipants() != null) {
                conversation.setParticipants(
                        conversation.getParticipants().stream()
                                .filter(Objects::nonNull)
                                .collect(Collectors.toList())
                );
            }
        }

        List<Conversation> sortedConversations = processedConversations.stream()
                .sorted(Comparator.comparing(Conversation::getDateUpdate, Comparator.reverseOrder()))
                .collect(Collectors.toList());

        return conversationMapper.mapConversations(sortedConversations);
    }

    @Override
    public ConversationResponse createConversation(ConversationRequest request) {
        var conversationExists = participantsHasConversation(request.getParticipants());
        if(conversationExists){
            return null;
        }
        var conversationMapper = new ConversationMapper(userService, new UserMapper());
        Conversation conversation = conversationMapper.mapConversationRequest(request);
        try {
            conversationRepository.save(conversation);
        } catch (Exception ex) {
            System.out.println(ex.getMessage());
        }

        return conversationMapper.apply(conversation);
    }

    @Override
    public ConversationResponse getConversationById(UUID id) {
        Conversation conversation = conversationRepository.findById(id).orElseThrow(() -> new ResolutionException("Conversation not found"));
        return conversationMapper.apply(conversation);
    }

    @Override
    public boolean participantsHasConversation(List<UUID> participantIds)  {
        if (participantIds == null || participantIds.isEmpty()) {
            return false;
        }

        List<Conversation> allConversations = conversationRepository.findAll(); // Retrieve all conversations

        for (Conversation conversation : allConversations) {
            boolean allMembersFound = true;
            List<User> participantsInThisConversation = conversation.getParticipants();

            if (participantsInThisConversation.size() != participantIds.size()) {
                continue;
            }

            for(UUID participantId : participantIds){
                boolean found = false;
                for(User participant : participantsInThisConversation){
                    if(participant != null && participant.getId() != null && participant.getId().equals(participantId)){
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    allMembersFound = false;
                    break;
                }
            }
            if (allMembersFound) {
                return true;
            }
        }

        return false;
    }
    @Override
    public List<MessageResponse> getMessages(String conversationId) {
        List<Message> messages = chatMessageRepository.findMessagesByConversationId(UUID.fromString(conversationId));
        return messageMapper.mapMessageResponse(messages);
    }
    @Override
    @Transactional
    public MessageResponse sendMessage(UUID conversationId, MessageRequest messageRequest) {
        boolean isSystemMessage = "system".equals(messageRequest.getUsername());

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));
        conversation.setDateUpdate(Instant.now());

        Message message = new Message();
        message.setContent(messageRequest.getContent());
        message.setImage(messageRequest.getImage());
        message.setConversation(conversation);
        message.setDateSent(Instant.now());
        message.setStates(List.of(MessageState.DELIVERED));
        message.setDateDelivered(Instant.now());

        if (isSystemMessage) {
            User systemUser = userService.getOrCreateSystemUser();
            message.setSender(systemUser);
        } else {
            User sender = userService.findUserByUsername(messageRequest.getUsername());
            if (sender == null) {
                throw new IllegalArgumentException("Sender not found");
            }
            message.setSender(sender);
        }

        Message savedMessage = chatMessageRepository.save(message);
        conversationRepository.save(conversation);

        return new MessageResponse(
                savedMessage.getId(),
                isSystemMessage ? null : new UserMapper().toUserResponseSecure(savedMessage.getSender()),
                savedMessage.getConversation().getId().toString(),
                savedMessage.getContent(),
                savedMessage.getImage(),
                savedMessage.getDateSent(),
                savedMessage.getDateDelivered(),
                savedMessage.getDateRead(),
                savedMessage.getStates()
        );
    }

    @Override
    public List<ConversationResponse> getAllGroupConversations() {
        List<Conversation> groupConversations = conversationRepository.findByGroupConversationTrue();

        // Sort by date if needed
        List<Conversation> sortedConversations = groupConversations.stream()
                .sorted(Comparator.comparing(Conversation::getDateUpdate, Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());

        return conversationMapper.mapConversations(sortedConversations);
    }

    @Transactional(dontRollbackOn = ObjectOptimisticLockingFailureException.class)
    public void addSystemUserToAllGroupChats() {
        int maxRetries = 3;
        int retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                User systemUser = userService.getOrCreateSystemUser();

                List<Conversation> groupConversations = conversationRepository.findByGroupConversationTrue();

                for (Conversation conversation : groupConversations) {
                    // Check if system user is already a participant
                    boolean hasSystemUser = conversation.getParticipants().stream()
                            .anyMatch(p -> p.getUsername().equals("system"));

                    if (!hasSystemUser) {
                        conversation.getParticipants().add(systemUser);
                    }
                }

                conversationRepository.saveAll(groupConversations);

                break;
            } catch (ObjectOptimisticLockingFailureException e) {
                retryCount++;
                if (retryCount >= maxRetries) {
                    log.warn("Failed to add system user to group chats after " + maxRetries + " attempts");
                    throw e; // Re-throw after max retries
                }
                log.info("Optimistic locking failure, retrying... (attempt " + retryCount + " of " + maxRetries + ")");

                // Short delay before retry
                try {
                    Thread.sleep(100 * retryCount);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("Thread interrupted during retry delay", ie);
                }
            }
        }
    }

    @Override
    public Conversation updateConversationById(UUID id) {
        Optional<Conversation> conversation = conversationRepository.findById(id);
        conversationRepository.save(conversation.get());
        return conversation.get();
    }

    @PostConstruct
    public void initializeSystemUser() {
        try {
            addSystemUserToAllGroupChats();
        } catch (Exception e) {
            // Log error but don't fail application start
            log.error("Failed to initialize system user: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public ConversationResponse createGroupConversation(ConversationRequest request, String groupName) {
        List<User> participants = new ArrayList<>();

        // Find all participants
        for (UUID participantId : request.getParticipants()) {
            User user = userService.findUserById(participantId);
            if (user != null) {
                participants.add(user);
            }
        }

        if (participants.size() < 3) {
            throw new IllegalArgumentException("Group chat requires at least 3 valid participants");
        }

        // Add system user to participants
        User systemUser = userService.getOrCreateSystemUser();

        // Check if system user is already included
        boolean hasSystemUser = participants.stream()
                .anyMatch(p -> p.getUsername().equals("system"));

        // Add if not already included
        if (!hasSystemUser) {
            participants.add(systemUser);
        }

        // Create group conversation with name
        Conversation conversation = Conversation.builder()
                .participants(participants)
                .dateUpdate(Instant.now())
                .groupConversation(true)
                .groupName(groupName != null ? groupName : "Group Chat")
                .build();

        Conversation savedConversation = conversationRepository.save(conversation);
        return conversationMapper.apply(savedConversation);
    }
    @Override
    @Transactional
    public ConversationResponse addGroupMembers(UUID conversationId, List<UUID> memberIds) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        // Verify
        if (!conversation.isGroupConversation()) {
            throw new IllegalArgumentException("Cannot add members to a non-group conversation");
        }

        List<User> currentParticipants = conversation.getParticipants();
        Set<UUID> currentParticipantIds = currentParticipants.stream()
                .map(User::getId)
                .collect(Collectors.toSet());

        // Add new members
        for (UUID memberId : memberIds) {
            if (currentParticipantIds.contains(memberId)) {
                continue;
            }

            User user = userService.findUserById(memberId);
            if (user != null) {
                conversation.getParticipants().add(user);
            }
        }

        conversation.setDateUpdate(Instant.now());
        Conversation updatedConversation = conversationRepository.save(conversation);

        return conversationMapper.apply(updatedConversation);
    }

    @Override
    @Transactional
    public ConversationResponse removeGroupMembers(UUID conversationId, List<UUID> memberIds) throws Exception {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        // Verify it's a group conversation
        if (!conversation.isGroupConversation()) {
            throw new IllegalArgumentException("Cannot remove members from a non-group conversation");
        }

        // Get current participants
        List<User> currentParticipants = conversation.getParticipants();

        // Remove specified members
        currentParticipants.removeIf(user -> memberIds.contains(user.getId()));

        // Ensure at least 3 participants remain (group chat requirement)
        if (currentParticipants.size() < 3) {
            throw new IllegalArgumentException("Cannot remove members as group chat requires at least 3 participants");
        }

        conversation.setDateUpdate(Instant.now());
        Conversation updatedConversation = conversationRepository.save(conversation);

        return conversationMapper.apply(updatedConversation);
    }

}