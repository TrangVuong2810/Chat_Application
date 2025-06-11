package com.chat.chat.config.websocket;

import com.chat.chat.controller.ConversationController;
import com.chat.chat.dto.UserStateDto;
import com.chat.chat.enums.NotificationType;
import com.chat.chat.enums.UserState;
import com.chat.chat.model.Conversation;
import com.chat.chat.model.Notification;
import com.chat.chat.model.User;
import com.chat.chat.repository.ConversationRepository;
import com.chat.chat.repository.UserRepository;
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
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

import java.security.Principal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.chat.chat.service.chat.ChatService;
import org.springframework.scheduling.TaskScheduler;

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
    private final TaskScheduler taskScheduler;
    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;
    private final WebSocketSessionRegistry webSocketSessionRegistry;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        Principal principal = headerAccessor.getUser();

        if (principal != null && sessionId != null) {
            String username = principal.getName();
            logger.info("User connected: {}", username);

            // Register session in registry
            webSocketSessionRegistry.registerSession(username, sessionId);

            // Update user state
            userService.updateUserStateAndLastLogin(username, UserState.ONLINE, Instant.now());

            // Notify the destination store
            destinationStore.connectWebsocket(username);

            // Broadcast user online state
            handleSession(username, "User connected: " + username, UserState.ONLINE);

            // Broadcast updated online users list
            chatService.broadcastOnlineUsers();
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        Principal principal = headerAccessor.getUser();

        if (principal != null && sessionId != null) {
            String username = principal.getName();
            logger.info("User disconnected: {}", username);

            // Check if this was triggered by API logout
            WebSocketSessionRegistry.StompSession session = webSocketSessionRegistry.findSessionsByUsername(username)
                    .stream()
                    .filter(s -> s.getSessionId().equals(sessionId))
                    .findFirst()
                    .orElse(null);

            boolean isApiLogout = session != null &&
                    session.getAttributes().containsKey("api_logout") &&
                    (boolean) session.getAttributes().get("api_logout");

            // Remove session from registry
            webSocketSessionRegistry.removeSession(username, sessionId);

            // If user has no more active sessions and this wasn't triggered by API logout
            if (!webSocketSessionRegistry.hasActiveSession(username) && !isApiLogout) {
                // Update user state to offline
                userService.updateUserStateAndLastLogin(username, UserState.OFFLINE, Instant.now());

                // Notify the destination store
                destinationStore.disconnectWebsocket(username);

                // Broadcast user offline state
                handleSession(username, "User disconnected: " + username, UserState.OFFLINE);

                // Broadcast updated online users list
                chatService.broadcastOnlineUsers();
            }
        }
    }

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
            if (simpDestination != null && simpDestination.startsWith(destination)) {
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
        if (headers.getUser() == null || headers.getUser().getName() == null) {
            logger.warn("User is null in SessionConnectedEvent for session id: {}", headers.getSessionId());
            return;
        }
        String username = headers.getUser().getName();
        String sessionId = headers.getSessionId();

        logger.info("User connected: {}, session id: {}", username, sessionId);

        userService.incrementUserSessions(username);
        userService.updateUserStateAndLastLogin(username, UserState.ONLINE, Instant.now());

        // Use scheduled executor instead of raw thread
        taskScheduler.schedule(() -> chatService.broadcastOnlineUsers(),
                Instant.now().plusMillis(100));
    }

    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor headers = StompHeaderAccessor.wrap(event.getMessage());
        if (headers.getUser() == null || headers.getUser().getName() == null) {
            logger.warn("User is null in SessionDisconnectEvent for session id: {}. Cannot process disconnect.", headers.getSessionId());
            return;
        }
        String username = headers.getUser().getName();
        CloseStatus closeStatus = event.getCloseStatus();

        logger.info("User disconnected: {}, session id: {}, disconnect reason: {}",
                username, headers.getSessionId(), event.getCloseStatus());

        User user = userRepository.findByUsername(username);
        if (user != null) {
            boolean isApiLogout = headers.getSessionAttributes() != null &&
                    Boolean.TRUE.equals(headers.getSessionAttributes().get("api_logout"));

            if (user.getUserState() == UserState.OFFLINE || isApiLogout) {
                // User already logged out via API or is being logged out, force reset sessions
                logger.info("User {} marked offline via logout API, forcing session count to zero", username);
                userService.resetUserSessions(username);
                userService.updateUserStateAndLastLogin(username, UserState.OFFLINE, Instant.now());
                chatService.broadcastOnlineUsers();
                broadcastUserOfflineToConversations(username);
                return;
            }
        }

        boolean noMoreSessions = userService.decrementUserSessions(username);

        if (noMoreSessions) {
            // Normal disconnect flow continues...
            boolean isNormalDisconnect = closeStatus != null &&
                    (closeStatus.getCode() == 1000 || closeStatus.getCode() == 1001 || closeStatus.getCode() == 1006);

            if (isNormalDisconnect) {
                logger.info("Normal disconnect detected for user {}, marking offline immediately", username);
                userService.updateUserStateAndLastLogin(username, UserState.OFFLINE, Instant.now());
                chatService.broadcastOnlineUsers();
                broadcastUserOfflineToConversations(username);
            } else {
                // Add a shorter delay for unexpected disconnections
                taskScheduler.schedule(() -> {
                    // Double-check if user has reconnected in the meantime
                    int currentSessions = userService.getUserSessions(username);
                    if (currentSessions == 0) {
                        try {
                            UserStateDto userState = userSocketService.findUserSocketByUsername(username);
                            if (userState == null || userState.getUserState() != UserState.ONLINE) {
                                userService.updateUserStateAndLastLogin(username, UserState.OFFLINE, Instant.now());
                                chatService.broadcastOnlineUsers();
                                broadcastUserOfflineToConversations(username);
                                logger.info("User {} marked as offline after delay verification", username);
                            } else {
                                logger.info("User {} is still online according to socket service, not marking offline", username);
                            }
                        } catch (Exception e) {
                            userService.updateUserStateAndLastLogin(username, UserState.OFFLINE, Instant.now());
                            chatService.broadcastOnlineUsers();
                            broadcastUserOfflineToConversations(username);
                            logger.warn("Error checking user state for {}, marking as offline: {}", username, e.getMessage());
                        }
                    } else {
                        logger.info("User {} has {} active sessions, not marking as offline", username, currentSessions);
                    }
                }, Instant.now().plusSeconds(2)); // Reduced delay to 2 seconds
            }
        }
    }

    private void broadcastUserOfflineToConversations(String username) {
        try {
            // Get all conversations the user was part of and broadcast updated online users
            User user = userRepository.findByUsername(username);
            if (user != null) {
                List<Conversation> userConversations = conversationRepository.findAllByParticipantsContaining(user);
                for (Conversation conversation : userConversations) {
                    chatService.broadcastConversationOnlineUsers(conversation.getId());
                }
            }
        } catch (Exception e) {
            logger.error("Error broadcasting user offline status to conversations: {}", e.getMessage());
        }
    }
}
