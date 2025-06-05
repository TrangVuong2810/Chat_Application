package com.chat.chat.mapper;

import com.chat.chat.model.Conversation;
import com.chat.chat.model.User;
import com.chat.chat.payload.request.ConversationRequest;
import com.chat.chat.payload.response.ConversationResponse;
import com.chat.chat.payload.response.MessageResponse;
import com.chat.chat.payload.response.UserResponse;
import com.chat.chat.service.conversation.ConversationService;
import com.chat.chat.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ConversationMapper implements Function<Conversation, ConversationResponse> {
    private final UserService userService;
    private final UserMapper userMapper;
    private ConversationService conversationService;
    @Autowired
    public void setConversationService(@Lazy ConversationService conversationService) {
        this.conversationService = conversationService;
    }

    @Override
    public ConversationResponse apply(Conversation conversation) {
        List<UUID> participantIds = (conversation.getParticipants() != null) ?
                conversation.getParticipants().stream()
                        .filter(Objects::nonNull)  // Filter out null participants
                        .map(User::getId)
                        .collect(Collectors.toList()) :
                List.of();

        List<User> participants = userService.findUsersById(participantIds).stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        List<MessageResponse> messageResponses = conversationService.getMessages(String.valueOf(conversation.getId()));
        List<MessageResponse> sortedMessages = messageResponses.stream()
                .sorted(Comparator.comparing(MessageResponse::getDateSent))
                .toList();
        //MessageResponse lastMessage = sortedMessages.get(sortedMessages.size() - 1);
        MessageResponse lastMessage = null;
        if (!sortedMessages.isEmpty()) {
            lastMessage = sortedMessages.get(sortedMessages.size() - 1);
        }
        return ConversationResponse.builder()
                .id(conversation.getId())
                .participants(participants)
                .dateStarted(conversation.getDateUpdate())
                .groupConversation(conversation.isGroupConversation())
                .groupName(conversation.getGroupName())
                .messages(sortedMessages)
                .dateUpdate(lastMessage != null ? lastMessage.getDateSent() : conversation.getDateUpdate())
                .build();
    }
    public List<ConversationResponse> mapConversations(List<Conversation> conversations) {

        return conversations.stream().map(c -> {
            List<MessageResponse> sortedMessage = conversationService.getMessages(String.valueOf(c.getId())).stream()
                    .sorted(Comparator.comparing(MessageResponse::getDateSent))
                    .toList();
            MessageResponse lastMessage = null;
            if (!sortedMessage.isEmpty()) {
                lastMessage = sortedMessage.get(sortedMessage.size() - 1);
            }
            List<User> filteredParticipants = (c.getParticipants() != null) ?
                    c.getParticipants().stream()
                            .filter(Objects::nonNull)
                            .collect(Collectors.toList()) :
                    List.of();
            return ConversationResponse.builder()
                    .id(c.getId())
                    .groupConversation(c.isGroupConversation())
                    .groupName(c.getGroupName())
                    .messages(sortedMessage)
                    .participants(filteredParticipants)
                    .dateUpdate(lastMessage != null ? lastMessage.getDateSent() : c.getDateUpdate())
                    .build();
        }).toList();
    }
    public Conversation mapConversationRequest(ConversationRequest conversationRequest) {
        var users = userService.findUsersById(conversationRequest.getParticipants());
        return Conversation.builder()
                .dateUpdate(Instant.now())
                .participants(users)
                .build();
    }
    public Conversation mapConversationResponse(ConversationResponse conversationResponse){
        List<User> filteredParticipants = (conversationResponse.getParticipants() != null) ?
                conversationResponse.getParticipants().stream()
                        .filter(Objects::nonNull)
                        .collect(Collectors.toList()) :
                List.of();

        return Conversation.builder()
                .groupConversation(conversationResponse.isGroupConversation())
                .id(conversationResponse.getId())
                .participants(filteredParticipants)
                .build();
    }
}