package com.chat.chat.config.websocket;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class WebSocketSessionRegistry {
    private static final Logger logger = LoggerFactory.getLogger(WebSocketSessionRegistry.class);
    private final Map<String, List<StompSession>> userSessions = new ConcurrentHashMap<>();

    public static class StompSession {
        private final String sessionId;
        private final Map<String, Object> attributes = new ConcurrentHashMap<>();

        public StompSession(String sessionId) {
            this.sessionId = sessionId;
        }

        public String getSessionId() {
            return sessionId;
        }

        public Map<String, Object> getAttributes() {
            return attributes;
        }
    }

    public void registerSession(String username, String sessionId) {
        logger.info("Registering session for user: {}", username);
        StompSession session = new StompSession(sessionId);
        userSessions.computeIfAbsent(username, k -> new ArrayList<>()).add(session);
    }

    public void removeSession(String username, String sessionId) {
        logger.info("Removing session for user: {}", username);
        if (userSessions.containsKey(username)) {
            userSessions.get(username).removeIf(session -> session.getSessionId().equals(sessionId));
            if (userSessions.get(username).isEmpty()) {
                userSessions.remove(username);
            }
        }
    }

    public List<StompSession> findSessionsByUsername(String username) {
        return userSessions.getOrDefault(username, new ArrayList<>());
    }

    public boolean hasActiveSession(String username) {
        return userSessions.containsKey(username) && !userSessions.get(username).isEmpty();
    }
}