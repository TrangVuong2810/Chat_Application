package com.chat.chat.dto;

import lombok.*;

@Getter
@Setter
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OnlineUserDto {
    private String username;
    private String fullName;
    private String profilePicture;
}
