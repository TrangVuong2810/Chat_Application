package com.chat.chat.service.friendrequest;

import com.chat.chat.dto.FriendRequestDto;
import com.chat.chat.enums.FriendRequestStatus;
import com.chat.chat.mapper.FriendRequestMapper;
import com.chat.chat.model.FriendRequest;
import com.chat.chat.model.User;
import com.chat.chat.payload.request.ConversationRequest;
import com.chat.chat.payload.request.SenderRequest;
import com.chat.chat.payload.response.FriendshipStatus;
import com.chat.chat.payload.response.ResponseObject;
import com.chat.chat.repository.FriendRequestRepository;
import com.chat.chat.repository.UserRepository;
import com.chat.chat.service.conversation.ConversationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.lang.module.ResolutionException;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class FriendRequestService implements IFriendRequestService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private FriendRequestRepository friendRequestRepository;
    @Autowired
    private FriendRequestMapper friendRequestMapper;
    @Autowired
    @Lazy
    private ConversationService conversationService;

    public ResponseEntity<?> sendFriendInvitation(UUID senderId, UUID receiverId) {
        User sender = userRepository.findById(senderId).orElseThrow(() -> new ResolutionException("User not found"));
        User receiver = userRepository.findById(receiverId).orElseThrow(() -> new ResolutionException("User not found"));
        if (senderId.equals(receiverId)) {
            return ResponseEntity.badRequest().body(new ResponseObject(HttpStatus.BAD_REQUEST.value(), "Cannot send friend request to yourself"));
        }
        if (areFriends(sender, receiver)) {
            return ResponseEntity.badRequest().body(new ResponseObject(HttpStatus.BAD_REQUEST.value(), "Users are already friendship", new FriendshipStatus(true)));
        }
        var isSent = friendRequestRepository.findBySenderAndReceiverAndStatus(sender, receiver, FriendRequestStatus.PENDING);
        if(!isSent.isEmpty()) {
            return ResponseEntity.badRequest().body(new ResponseObject(HttpStatus.BAD_REQUEST.value(), "Friend request has sent already"));
        }
        FriendRequest friendRequest = new FriendRequest();
        friendRequest.setSender(sender);
        friendRequest.setReceiver(receiver);
        friendRequest.setStatus(FriendRequestStatus.PENDING);

        friendRequestRepository.save(friendRequest);
        return ResponseEntity.ok().body(new ResponseObject(HttpStatus.ACCEPTED.value(), "Sent request successfully", friendRequest));
    }
    public ResponseEntity<?> changeFriendRequestStatus(Long requestId, SenderRequest senderRequest) {
        UUID senderId = senderRequest.getSenderId();
        FriendRequestStatus friendRequestStatus = FriendRequestStatus.valueOf(senderRequest.getFriendRequestStatus());
        FriendRequest friendRequest = friendRequestRepository.findById(requestId).orElseThrow(() -> new ResolutionException("Friend request not found"));

        // Update the status
        friendRequest.setStatus(friendRequestStatus);

        // Only create conversation and set friendship date if accepted
        if(friendRequestStatus.equals(FriendRequestStatus.ACCEPTED)) {
            friendRequest.setFriendshipDate(Instant.now());

            User sender = friendRequest.getSender();
            User receiver = friendRequest.getReceiver();

            List<UUID> participantIds = Arrays.asList(sender.getId(), receiver.getId());
            boolean conversationExists = conversationService.participantsHasConversation(participantIds);

            if (!conversationExists) {
                ConversationRequest conversationRequest = ConversationRequest.builder()
                        .participants(participantIds)
                        .dateStarted(Instant.now())
                        .build();

                conversationService.createConversation(conversationRequest);
            }
        }

        String message = "Change status to " + friendRequestStatus.name() + " successfully";
        return ResponseEntity.ok().body(new ResponseObject(201, message));
    }
    public boolean areFriends(User account1, User account2) {
        return !friendRequestRepository.findBySenderAndReceiverAndStatus(account1, account2, FriendRequestStatus.ACCEPTED).isEmpty()
                || !friendRequestRepository.findBySenderAndReceiverAndStatus(account2, account1, FriendRequestStatus.ACCEPTED).isEmpty();
    }

    @Override
    public List<FriendRequest> findByReceiverAndStatus(User receiver, FriendRequestStatus status) {
        return friendRequestRepository.findByReceiverAndStatus(receiver, status);
    }

    @Override
    public List<FriendRequest> findBySenderAndStatus(User sender, FriendRequestStatus status) {
        return friendRequestRepository.findBySenderAndStatus(sender, status);
    }

    @Override
    public FriendRequest findByReceiver(User receiver) {
        return friendRequestRepository.findByReceiver(receiver);
    }

    @Override
    public FriendRequest findFriendRequestById(Long id) {
        Optional<FriendRequest> friendRequest = friendRequestRepository.findById(id);
        return friendRequest.orElse(null);
    }

    @Override
    public List<FriendRequestDto> findFriendRequestsByUserId(UUID userId) {
        User user = userRepository.findById(userId).get();
        List<FriendRequest> friendRequests = friendRequestRepository.findByUserAsSenderOrReceiver(user);
        return friendRequests.stream()
                .map(fr -> friendRequestMapper.toFriendRequestDto(fr))
                .collect(Collectors.toList());
    }

    @Override
    public void deleteFriendRequestById(Long requestId) {
        friendRequestRepository.deleteById(requestId)       ;
    }
}
