package com.chat.chat.service.chat;

import com.chat.chat.dto.*;
import com.chat.chat.model.User;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;

import java.util.List;
import java.util.UUID;

public interface IChatService {
    //    void processMessage(NotificationDTO notificationDTO, Principal principal);

    List<OnlineUserDto> fetchOnlineUsers();

    List<ConversationDto> fetchConversations(String name);
    void createAndSendConversation(List<User> users, StompHeaderAccessor accessor);
    void changeUserState(UserStateDto userStateDto, String username);
    MessageDto saveOrUpdateMessage(List<User> users, MessageDto message);
    PrevMessageDto fetchPreviousChat(UUID conversationId, int page, String currentUser);


}