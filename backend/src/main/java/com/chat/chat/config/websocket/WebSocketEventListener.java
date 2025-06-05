package com.chat.chat.config.websocket;

import com.chat.chat.controller.ConversationController;
import com.chat.chat.dto.UserStateDto;
import com.chat.chat.enums.NotificationType;
import com.chat.chat.enums.UserState;
import com.chat.chat.model.Notification;
import com.chat.chat.service.UserSocketService;
import com.chat.chat.service.user.UserService;
import com.google.gson.Gson;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.GenericMessage;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

import java.security.Principal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.chat.chat.service.chat.ChatService;

@Component
@RequiredArgsConstructor
public class WebSocketEventListener {
    private static final Logger logger = LoggerFactory.getLogger(WebSocketEventListener.class);
    private final SimpMessagingTemplate template;
    private final UserSocketService userSocketService;
    private final UserService userService;
    private final DestinationStore destinationStore;
    private final ChatService chatService;
    private final ConversationController conversationController;
    private void handleSession(String username, String logText, UserState userState) {
        logger.info(logText);
        Notification notification = new Notification();
        notification.setTime(Instant.now());
        notification.setContent(logText);
        notification.setType(NotificationType.USER_STATE);
        notification.addToMetadata("USER", username);
        notification.addToMetadata("STATE", userState.name());
        // Notify everyone about user.
        template.convertAndSend("/topic/public", notification);
    }

    private void onUserSubscribe(String username) {
        Notification notification = new Notification();
        notification.setTime(Instant.now());
        notification.setType(NotificationType.ONLINE_USERS);
        List<UserStateDto> userSocketDTOS = userSocketService.getSubscribedSocketUsersByDestination("/topic/public");
        userSocketDTOS.removeIf(userState -> userState.getUsername().equals(username));
        notification.addToMetadata("USERS", String.join(", ", new Gson().toJson(userSocketDTOS)));
        template.convertAndSendToUser(username
                , "/queue/messages", notification);
    }

    @EventListener
    public void handleSessionSubscribeEvent(SessionSubscribeEvent event) {
        Principal principal = event.getUser();
        StompHeaderAccessor sha = StompHeaderAccessor.wrap(event.getMessage());
        if (principal != null) {
            String username = principal.getName();
            GenericMessage message = (GenericMessage) event.getMessage();
            String simpDestination = (String) message.getHeaders().get("simpDestination");
            String destination = "/user/" + username + "/queue/messages";
            destinationStore.registerDestination(sha.getSessionId(), sha.getDestination(), username);
            if (simpDestination.startsWith(destination)) {
                onUserSubscribe(principal.getName());
            }

            // Handle group chat subscription
            if (simpDestination.matches("/topic/chat/.*")) {
                String conversationId = simpDestination.substring(simpDestination.lastIndexOf('/') + 1);
                try {
                    UUID conversationUuid = UUID.fromString(conversationId);

                    // Send online users for this specific conversation
                    conversationController.broadcastConversationOnlineUsers(conversationUuid);
                } catch (IllegalArgumentException e) {
                    //log.error("Invalid conversation ID in subscription: {}", conversationId);
                }
            }
        }
    }
    @EventListener
    public void handleSessionConnected(SessionConnectedEvent event) {
        StompHeaderAccessor headers = StompHeaderAccessor.wrap(event.getMessage());
        String username = headers.getUser().getName();

        userService.updateUserStateAndLastLogin(username, UserState.ONLINE, Instant.now());

        chatService.broadcastOnlineUsers();
    }

    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor headers = StompHeaderAccessor.wrap(event.getMessage());
        String username = headers.getUser().getName();

        userService.updateUserStateAndLastLogin(username, UserState.OFFLINE, Instant.now());

        chatService.broadcastOnlineUsers();
    }
}
