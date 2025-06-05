package com.chat.chat.model;

import com.chat.chat.enums.Role;
import com.chat.chat.enums.UserState;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private String fullName;
    private String username;
    private String password;
    private String email;
    private String phone;
    private String address;
    @ElementCollection(targetClass = Role.class)
    @Enumerated(EnumType.STRING)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "role")
    private List<Role> roles;
    @Enumerated(EnumType.STRING)
    @Column(name = "state")
    private UserState userState;
    @JsonIgnore
    @ManyToMany(mappedBy = "participants" ,cascade = CascadeType.ALL)
    private List<Conversation> conversationsByUserId;

    private Instant lastOnline;
    @Column(name = "profile_picture")
    private String profilePicture;
    @Column(name = "current_sessions")
    private Byte sessions = 0;


    public User(String fullName, String username, String password, String email) {
        this.fullName = fullName;
        this.username = username;
        this.password = password;
        this.email = email;
    }

    public User(UUID id, String fullName, String username, String email, List<Role> roles) {
        this.id = id;
        this.fullName = fullName;
        this.username = username;
        this.email = email;
        this.roles = roles;
    }
}