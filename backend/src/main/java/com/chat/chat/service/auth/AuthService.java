package com.chat.chat.service.auth;

import com.chat.chat.enums.Role;
import com.chat.chat.mapper.UserMapper;
import com.chat.chat.model.User;
import com.chat.chat.payload.request.LoginRequest;
import com.chat.chat.payload.request.RegisterRequest;
import com.chat.chat.payload.response.JwtResponse;
import com.chat.chat.payload.response.ResponseObject;
import com.chat.chat.repository.UserRepository;
import com.chat.chat.security.jwt.JwtUtils;
import com.chat.chat.security.service.UserDetailsImpl;
import com.chat.chat.security.service.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
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

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService implements IAuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final UserMapper userMapper;
    @Autowired
    private UserDetailsServiceImpl userDetailsService;
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
            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
            SecurityContextHolder.getContext().setAuthentication(authToken);

        }
        return SecurityContextHolder.getContext().getAuthentication();
    }



}