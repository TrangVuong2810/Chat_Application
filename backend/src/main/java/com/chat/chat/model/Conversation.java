package com.chat.chat.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Entity
@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "conversation")
public class Conversation {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "user_conversation",
            joinColumns = @JoinColumn(name = "conversation_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private List<User> participants;
    private boolean groupConversation = false;
    @Column(name = "group_name")
    private String groupName;

    private Instant dateUpdate;

    public Conversation(List<User> participants) {
        this.participants = participants;
        this.dateUpdate = Instant.now();
    }
}