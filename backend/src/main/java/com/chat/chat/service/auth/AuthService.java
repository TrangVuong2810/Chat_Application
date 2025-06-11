package com.chat.chat.service.auth;

import com.chat.chat.config.websocket.WebSocketSessionRegistry;
import com.chat.chat.enums.Role;
import com.chat.chat.enums.UserState;
import com.chat.chat.mapper.UserMapper;
import com.chat.chat.model.Conversation;
import com.chat.chat.model.User;
import com.chat.chat.payload.request.LoginRequest;
import com.chat.chat.payload.request.RegisterRequest;
import com.chat.chat.payload.response.JwtResponse;
import com.chat.chat.payload.response.ResponseObject;
import com.chat.chat.repository.ConversationRepository;
import com.chat.chat.repository.UserRepository;
import com.chat.chat.security.jwt.JwtUtils;
import com.chat.chat.security.service.UserDetailsImpl;
import com.chat.chat.security.service.UserDetailsServiceImpl;
import com.chat.chat.service.chat.ChatService;
import com.chat.chat.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService implements IAuthService {
    private final UserRepository userRepository;
    private final ConversationRepository conversationRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final UserMapper userMapper;
    private final WebSocketSessionRegistry webSocketSessionRegistry;
    @Autowired
    private UserDetailsServiceImpl userDetailsService;
    @Autowired
    private UserService userService;
    @Autowired
    @Lazy
    private ChatService chatService;
    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);
    @Override
    public ResponseEntity<?> registerUser(RegisterRequest registerRequest) {
        if(userRepository.existsByEmail(registerRequest.getEmail())){
            return ResponseEntity.badRequest().body(new ResponseObject(400,"Email existed", null ));
        }
        if(userRepository.existsByUsername(registerRequest.getUsername())){
            return ResponseEntity.badRequest().body(new ResponseObject(400,"Username existed", null ));
        }
        User user = new User(
                registerRequest.getFullName(),
                registerRequest.getUsername(),
                passwordEncoder.encode(registerRequest.getPassword()),
                registerRequest.getEmail()
        );
        try {
            user.setRoles(List.of(Role.ROLE_USER));
            user.setUserState(UserState.OFFLINE);
            user.setLastOnline(Instant.now());
            userRepository.save(user);
            return ResponseEntity.ok(new ResponseObject(200, "Register new account successfully", user));
        } catch (Exception e){
            return ResponseEntity.badRequest().body(new ResponseObject(500, "Register failed", null));
        }
    }

    @Override
    public ResponseEntity<?> login(LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(loginRequest.getCredential(), loginRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtUtils.generateJwtToken(authentication);


            UserDetailsImpl userDetails = (UserDetailsImpl)  authentication.getPrincipal();
            // Update user state to ONLINE during login
            userService.updateUserStateAndLastLogin(userDetails.getUsername(), UserState.ONLINE, Instant.now());
            return ResponseEntity.ok(new ResponseObject(201, "Login successfully", new JwtResponse(jwt, userMapper.mapUserDetailToUser(userDetails)
            )));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new ResponseObject(HttpStatus.BAD_REQUEST.value(), e.getMessage(), null));
        }
    }

    @Override
    public Authentication authenticateUserFromHeaderAuth(String headerAuth) {
        String bearer = "Bearer ";
        if(!StringUtils.hasText(headerAuth) || !headerAuth.startsWith(bearer)){
            return null;
        }
        var jwtToken = headerAuth.substring(bearer.length());
        var email = jwtUtils.getEmailFromJwt(jwtToken);
        if((email != null || SecurityContextHolder.getContext().getAuthentication() != null) && jwtUtils.validateJwtToken(jwtToken)){
            UserDetails userDetails = userDetailsService.loadUserByUsername(email);
            userService.updateUserStateAndLastLogin(userDetails.getUsername(), UserState.ONLINE, Instant.now());
            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
            SecurityContextHolder.getContext().setAuthentication(authToken);

        }
        return SecurityContextHolder.getContext().getAuthentication();
    }

    @Override
    public ResponseEntity<?> logout(String username) {
        try {
            // Mark user OFFLINE and reset sessions
            userService.updateUserStateAndLastLogin(username, UserState.OFFLINE, Instant.now());
            userService.resetUserSessions(username);

            // Set api_logout flag in active sessions
            webSocketSessionRegistry.findSessionsByUsername(username)
                    .forEach(session -> {
                        session.getAttributes().put("api_logout", true);
                    });

            logger.info("User {} logged out, sessions reset, broadcasting offline state", username);

            chatService.broadcastOnlineUsers();
            broadcastUserOfflineToConversations(username);
            return ResponseEntity.ok(new ResponseObject(200, "Logged out successfully", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseObject(500, "Logout failed: " + e.getMessage(), null));
        }
    }

    private void broadcastUserOfflineToConversations(String username) {
        try {
            User user = userRepository.findByUsername(username);
            if (user != null) {
                List<Conversation> userConversations = conversationRepository.findAllByParticipantsContaining(user);
                for (Conversation conversation : userConversations) {
                    chatService.broadcastConversationOnlineUsers(conversation.getId());
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

}