package com.chat.chat.payload.request;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
public class MessageRequest {
    private String username;
    private UUID conversationId;
    private String content;
    private String image;
}
