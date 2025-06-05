package com.chat.chat.service.user;

import com.chat.chat.enums.UserState;
import com.chat.chat.model.User;
import com.chat.chat.payload.response.FriendRequestResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface IUserService {
    List<User> findAllUser();
    User findUserByEmail(String email);
    User findUserById(UUID id);
    List<User> findUsersById(List<UUID> participants);
    List<User> findUsersInConversation(UUID conversationId);
    UserDetails currentUser(HttpServletRequest request);
    boolean deleteUserByEmail(String email);
    List<User> getFriendList(UUID userId);
    User updateUserStateAndLastLogin(String username, UserState userState, Instant time);
    User findByUsernameAndPassword(String username, String password);
    User updateNewPassword(UUID userId, String password);

    List<FriendRequestResponse> getFriendRequestList(UUID userId);
    List<User> findNonFriendUsers(UUID userId);
}