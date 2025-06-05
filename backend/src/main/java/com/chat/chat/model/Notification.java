package com.chat.chat.model;


import com.chat.chat.enums.NotificationType;
import lombok.Data;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Data
public class Notification {
    private String content;
    private NotificationType type;
    private Map<String, String> metadata = new HashMap<>();
    private Instant time;

    public void addToMetadata(String key, String value) {
        this.metadata.put(key, value);
    }
}