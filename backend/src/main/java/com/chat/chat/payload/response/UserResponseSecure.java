package com.chat.chat.payload.response;

import com.chat.chat.enums.Role;
import com.chat.chat.enums.UserState;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
public class UserResponseSecure {
    private UUID id;
    private String fullName;
    private String username;
    private String profilePicture;
    private String email;
    private List<Role> roles;
    private UserState userState;
    private Instant lastOnline;
    private String phone;
}