package com.chat.chat.payload.response;

import com.chat.chat.model.User;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FriendRequestResponse {
    private Long requestId;
    private User sender;

}