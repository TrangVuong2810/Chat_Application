package com.chat.chat.payload.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class SenderRequest {
    private UUID senderId;
    private String friendRequestStatus;
    private String friendRole;
}
