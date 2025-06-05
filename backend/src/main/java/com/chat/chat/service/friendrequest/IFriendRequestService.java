package com.chat.chat.service.friendrequest;

import com.chat.chat.dto.FriendRequestDto;
import com.chat.chat.enums.FriendRequestStatus;
import com.chat.chat.model.FriendRequest;
import com.chat.chat.model.User;

import java.util.List;
import java.util.UUID;

public interface IFriendRequestService {
    List<FriendRequest> findByReceiverAndStatus(User receiver, FriendRequestStatus status);

    List<FriendRequest> findBySenderAndStatus(User sender, FriendRequestStatus status);
    FriendRequest findByReceiver(User receiver);
    FriendRequest findFriendRequestById(Long id);
    List<FriendRequestDto> findFriendRequestsByUserId(UUID userId);
    void deleteFriendRequestById(Long requestId);
}