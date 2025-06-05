package com.chat.chat.payload.request;

import lombok.Data;
import jakarta.validation.constraints.NotNull;

@Data
public class LoginRequest {
    @NotNull(message = "Credential is required")
    private String credential;
    @NotNull(message = "Password is required")
    private String password;
}