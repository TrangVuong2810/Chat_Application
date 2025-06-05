package com.chat.chat.repository;

import com.chat.chat.enums.FriendRequestStatus;
import com.chat.chat.model.FriendRequest;
import com.chat.chat.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;

public interface FriendRequestRepository extends JpaRepository<FriendRequest, Long> {
    List<FriendRequest> findByReceiverAndStatus(User receiver, FriendRequestStatus status);
    List<FriendRequest> findBySenderAndStatus(User sender, FriendRequestStatus status);

    FriendRequest findByReceiver(User receiver);

    @Query("SELECT fr FROM FriendRequest fr WHERE fr.sender = :user OR fr.receiver = :user")
    List<FriendRequest> findByUserAsSenderOrReceiver(User user);
    Collection<Object> findBySenderAndReceiverAndStatus(User account1, User account2, FriendRequestStatus friendRequestStatus);
}
