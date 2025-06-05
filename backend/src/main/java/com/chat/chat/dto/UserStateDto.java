package com.chat.chat.dto;

import com.chat.chat.enums.TypingState;
import com.chat.chat.enums.UserState;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserStateDto {
    private String username;
    private Instant lastOnline;
    private TypingState typingState;
    private UserState userState;

    public UserStateDto(String username, UserState userState) {
        this.username = username;
        this.userState = userState;
    }
}
