package com.chat.chat.mapper;


import com.chat.chat.enums.Role;
import com.chat.chat.model.User;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import com.chat.chat.payload.response.UserResponse;
import com.chat.chat.payload.response.UserResponseSecure;
import com.chat.chat.security.service.UserDetailsImpl;
import lombok.extern.apachecommons.CommonsLog;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@CommonsLog
@Component
public class UserMapper {
    public User mapUserDetailToUser(UserDetailsImpl userDetail) {
        return mapUserDetailToUser(userDetail, true);
    }
    public User mapUserDetailToUser(UserDetailsImpl userDetail, boolean ignorePassword) {
        User user = new User();
        user.setId(userDetail.getId());
        user.setFullName(userDetail.getFullName());
        user.setUsername(userDetail.getUsername());
        user.setEmail(userDetail.getEmail());
        user.setProfilePicture(userDetail.getProfilePicture());
        if(!ignorePassword){
            user.setPassword(userDetail.getPassword());
        }

        List<Role> roles = new ArrayList<>();
        if (userDetail.getAuthorities() != null) {
            for (GrantedAuthority authority : userDetail.getAuthorities()) {
                roles.add(Role.valueOf(authority.getAuthority()));
            }
        }
        user.setRoles(roles);
        return user;
    }
    public List<User> mapperToUserIgnorePasswordField(List<User> userList){
        return userList.stream().map(this::mapperToUserIgnorePasswordField).toList();
    }
    public User mapperToUserIgnorePasswordField(User user){
        return new User(user.getId(),user.getFullName(), user.getUsername(), user.getEmail(), user.getRoles());
    }
    public UserResponse mapUserToUserResponse(User user){
        return UserResponse.builder().fullName(user.getFullName()).id(user.getId()).build();
    }
    public List<UserResponse> mapUsers(List<User> users) {
        return users.stream()
                .map(this::mapUserToUserResponse)
                .collect(Collectors.toList());
    }
    public List<UUID> toListUUID(List<User> users){
        return users.stream()
                .map(User::getId)
                .collect(Collectors.toList());
    }
    public UserDetails toUserDetails(User user) {
        return UserDetailsImpl.build(user);
    }
    public UserResponseSecure toUserResponseSecure(User user){
        return UserResponseSecure.builder()
                .id(user.getId())
                .email(user.getEmail())
                .phone(user.getPhone())
                .userState(user.getUserState())
                .profilePicture(user.getProfilePicture())
                .username(user.getUsername())
                .lastOnline(user.getLastOnline())
                .roles(user.getRoles())
                .fullName(user.getFullName())
                .build();
    }
}