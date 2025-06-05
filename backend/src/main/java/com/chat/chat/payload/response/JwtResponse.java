package com.chat.chat.payload.response;

import com.chat.chat.model.User;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class JwtResponse {
    private String accessToken;
    private User user;
}