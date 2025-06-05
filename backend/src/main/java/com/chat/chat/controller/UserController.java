package com.chat.chat.controller;

import com.chat.chat.dto.PasswordDto;
import com.chat.chat.model.User;
import com.chat.chat.payload.response.FriendRequestResponse;
import com.chat.chat.payload.response.ResponseObject;
import com.chat.chat.repository.UserRepository;
import com.chat.chat.service.user.IUserService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.apache.coyote.BadRequestException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping(path = "/api/user")
@RequiredArgsConstructor
public class UserController {
    private final IUserService iUserService;
    @GetMapping()
    public ResponseEntity<?> findAllUsers(){
        List<User> users = iUserService.findAllUser();
        if(users.isEmpty()) {
            return ResponseEntity.badRequest().body(new ResponseObject(404, "Users not found", null));
        }
        return ResponseEntity.ok(new ResponseObject(200, "Fetch all users successfully", users));
    }

    @GetMapping("/by-email")
    public ResponseEntity<?> finUserByEmail(@RequestParam(value = "email", required = false) String email){
        User user = iUserService.findUserByEmail(email);
        SecurityContext holder = SecurityContextHolder.getContext();
        log.info(holder.toString());
        if(user == null){
            return ResponseEntity.badRequest().body(new ResponseObject(404, "User not found", null));
        }
        return ResponseEntity.ok(new ResponseObject(200, "Fetch user successfully", user));
    }
    @GetMapping("/find-user-in-conversation/{conversationId}")
    public ResponseEntity<?> findUsersInConversation(@PathVariable String conversationId) {
        List<User> users = iUserService.findUsersInConversation(UUID.fromString(conversationId));
        return ResponseEntity.ok(new ResponseObject(200, "Fetch users successfully", users));

    }
    @DeleteMapping("/{email}")
    public ResponseEntity<?> deleteUserByEmail(@PathVariable String email){
        var deleted = iUserService.deleteUserByEmail(email);
        if(deleted){
            return ResponseEntity.ok(new ResponseObject(200, "Deleted successfully"));
        }
        return ResponseEntity.badRequest().body(new ResponseObject(500, "Failed deleted"));

    }
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(HttpServletRequest request) {
        var user = iUserService.currentUser(request);
        if(user != null){
            return ResponseEntity.ok(new ResponseObject(200, "Get current user successfully", user));
        }
        return ResponseEntity.badRequest().body(new ResponseObject(500, "Failed fetch"));

    }
    @GetMapping("/friend-list/{userId}")
    public ResponseEntity<?> getFriendList(@PathVariable String userId) throws BadRequestException {
        List<User> friends = iUserService.getFriendList(UUID.fromString(userId));
        return ResponseEntity.ok().body(new ResponseObject(200, "Fetch friends successfully", friends));
    }
    @SneakyThrows
    @GetMapping("/friend-requests/{userId}")
    public ResponseEntity<?> getFriendRequests(@PathVariable String userId) {
        List<FriendRequestResponse> friendRequestList = iUserService.getFriendRequestList(UUID.fromString(userId));
        return ResponseEntity.ok().body(new ResponseObject(200, "Fetch friend requests successfully", friendRequestList));
    }
    @PutMapping("/update-password/{userId}")
    public ResponseEntity<?> updatePassword(@PathVariable String userId, @RequestBody PasswordDto passwordDto){
        User user = iUserService.updateNewPassword(UUID.fromString(userId), passwordDto.getNewPassword());
        if(user == null){
            return ResponseEntity.badRequest().body(new ResponseObject(400, "Update password failed"));
        }
        return ResponseEntity.ok().body(new ResponseObject(200, "Update password successfully", user));
    }
    @GetMapping("/non-friends/{userId}")
    public ResponseEntity<?> findNonFriendUsers(@PathVariable String userId) {
        List<User> nonFriendUsers = iUserService.findNonFriendUsers(UUID.fromString(userId));
        return ResponseEntity.ok(new ResponseObject(200, "Fetch non-friend users successfully", nonFriendUsers));
    }
}