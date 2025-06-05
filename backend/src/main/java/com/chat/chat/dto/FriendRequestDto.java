package com.chat.chat.dto;

import com.chat.chat.enums.FriendRequestStatus;
import com.chat.chat.model.User;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FriendRequestDto {
    private Long id;
    private User sender;
    private User receiver;
    private FriendRequestStatus status;
}
