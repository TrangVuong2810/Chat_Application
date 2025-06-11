package com.chat.chat.service.auth;

import com.chat.chat.payload.request.LoginRequest;
import com.chat.chat.payload.request.RegisterRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

public interface IAuthService {
    ResponseEntity<?> registerUser(RegisterRequest registerRequest);
    ResponseEntity<?> login(LoginRequest loginRequest);
    Authentication authenticateUserFromHeaderAuth(String authHeader);
    ResponseEntity<?> logout(String username);
}