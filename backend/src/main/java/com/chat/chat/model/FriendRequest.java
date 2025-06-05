package com.chat.chat.model;

import com.chat.chat.enums.FriendRequestStatus;
import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;

@Entity
@Data
@Table(name = "friend_request")
public class FriendRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @JoinColumn(name = "sender")
    private User sender;
    @ManyToOne
    @JoinColumn(name = "receiver")
    private User receiver;
    @Enumerated(EnumType.STRING)
    private FriendRequestStatus status;
    private Instant friendshipDate;

}