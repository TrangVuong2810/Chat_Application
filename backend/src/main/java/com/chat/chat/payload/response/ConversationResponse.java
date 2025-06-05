package com.chat.chat.payload.response;

import com.chat.chat.model.User;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ConversationResponse {
    private UUID id;
    private List<User> participants;
    private Instant dateStarted;
    private List<MessageResponse> messages;
    private boolean groupConversation;
    private String groupName;
    private Instant dateUpdate;
}