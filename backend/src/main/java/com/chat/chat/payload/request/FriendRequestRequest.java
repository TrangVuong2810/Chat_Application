package com.chat.chat.payload.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class FriendRequestRequest {
    @NotNull(message = "Sender is required")
    private UUID senderId;
    @NotNull(message = "Receiver is required")
    private UUID receiverId;
}
