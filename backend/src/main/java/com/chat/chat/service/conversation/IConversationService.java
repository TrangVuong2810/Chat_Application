package com.chat.chat.service.conversation;

import com.chat.chat.model.Conversation;
import com.chat.chat.payload.request.ConversationRequest;
import com.chat.chat.payload.request.MessageRequest;
import com.chat.chat.payload.response.ConversationResponse;
import com.chat.chat.payload.response.MessageResponse;

import java.util.List;
import java.util.UUID;

public interface IConversationService {
    List<ConversationResponse> getAllConversations();
    List<ConversationResponse> getAllConversationsByUserId(UUID id);
    ConversationResponse createConversation(ConversationRequest request) throws Exception;
    ConversationResponse getConversationById(UUID id);
    boolean participantsHasConversation(List<UUID> participantIds);
    Conversation updateConversationById(UUID id);
    List<MessageResponse> getMessages(String conversationId);

    List<ConversationResponse> getAllGroupConversations();

    MessageResponse sendMessage(UUID conversationId, MessageRequest messageRequest);
    ConversationResponse createGroupConversation(ConversationRequest request, String groupName);
    ConversationResponse addGroupMembers(UUID conversationId, List<UUID> newMemberIds) throws Exception;
    ConversationResponse removeGroupMembers(UUID conversationId, List<UUID> memberIds) throws Exception;
}
