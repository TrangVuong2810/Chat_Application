package com.chat.chat.dto;

import com.chat.chat.enums.MessageState;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@ToString
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MessageDto {
    @NotNull
    private UUID id;
    private String content;
    private String conversationId;
    private byte[] image;
    private String sender;
    private String dateSent;
    private String dateDelivered;
    private String dateRead;
    private List<MessageState> states;
}
