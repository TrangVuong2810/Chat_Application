package com.chat.chat.mapper;

import com.chat.chat.model.Message;
import com.chat.chat.payload.response.MessageResponse;
import com.chat.chat.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ChatMessageMapper implements Function<Message, MessageResponse> {
    private final UserMapper userMapper;
    @Override
    public MessageResponse apply(Message message) {
        if (message == null) {
            return null;
        }

        // Handle case where sender might be null
        var userResponse = message.getSender() != null
                ? userMapper.toUserResponseSecure(message.getSender())
                : null;

        return MessageResponse.builder()
                .id(message.getId())
                .sender(userResponse)
                .conversationId(String.valueOf(message.getConversation().getId()))
                .content(message.getContent())
                .image(message.getImage())
                .dateSent(message.getDateSent())
                .dateDelivered(message.getDateDelivered())
                .dateRead(message.getDateRead())
                .states(message.getStates())
                .build();
    }
    public List<MessageResponse> mapMessageResponse(List<Message> messages) {
        return messages.stream()
                .map(this::apply)
                .collect(Collectors.toList());
    }

}