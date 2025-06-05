package com.chat.chat.controller;

import com.chat.chat.dto.FriendRequestDto;
import com.chat.chat.enums.FriendRequestStatus;
import com.chat.chat.model.FriendRequest;
import com.chat.chat.model.User;
import com.chat.chat.payload.request.FriendRequestRequest;
import com.chat.chat.payload.request.SenderRequest;
import com.chat.chat.payload.response.ResponseObject;
import com.chat.chat.service.friendrequest.FriendRequestService;
import org.apache.coyote.BadRequestException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(path = "/api/friendship")
public class FriendRequestController {
    @Autowired
    private FriendRequestService friendService;
    @PostMapping("/requests")
    public ResponseEntity<?> sendFriendRequest(@RequestBody FriendRequestRequest friendRequestDto) throws BadRequestException {
        return friendService.sendFriendInvitation(friendRequestDto.getSenderId(), friendRequestDto.getReceiverId());

    }
    @GetMapping("/by-userId/{userId}")
    public List<FriendRequestDto> findFriendRequestsByUserId(@PathVariable String userId) {
        return friendService.findFriendRequestsByUserId(UUID.fromString(userId));
    }

    public List<FriendRequest> findBySenderAndStatus(User sender, FriendRequestStatus status) {
        return friendService.findBySenderAndStatus(sender, status);
    }
    @PutMapping("/change-status-friend-request/{requestId}")
    public ResponseEntity<?> acceptFriendRequest(@PathVariable Long requestId, @RequestBody SenderRequest senderRequest) throws BadRequestException {
        return friendService.changeFriendRequestStatus(requestId, senderRequest);
    }
    @DeleteMapping("/{friendRequestId}")
    public ResponseEntity<String> deleteFriendRequest(@PathVariable String friendRequestId) {
        friendService.deleteFriendRequestById(Long.parseLong(friendRequestId));
        return ResponseEntity.ok("Friend request deleted successfully");
    }
    @GetMapping("/by-id/{requestId}")
    public ResponseEntity<?> findFriendRequestById(@PathVariable String requestId) {
        var friendRequest = friendService.findFriendRequestById(Long.parseLong(requestId));
        if( friendRequest != null ) {
            return ResponseEntity.ok(new ResponseObject(200, "Fetch friend request successfully", friendRequest));
        }
        return ResponseEntity.badRequest().body(new ResponseObject(400, "Failed fetch"));
    }
}
