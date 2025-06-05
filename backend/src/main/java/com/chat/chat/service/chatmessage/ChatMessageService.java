package com.chat.chat.service.chatmessage;

import com.chat.chat.enums.MessageState;
import com.chat.chat.mapper.ConversationMapper;
import com.chat.chat.model.Message;
import com.chat.chat.payload.request.MessageRequest;
import com.chat.chat.payload.response.ConversationResponse;
import com.chat.chat.repository.ChatMessageRepository;
import com.chat.chat.service.conversation.ConversationService;
import com.chat.chat.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatMessageService implements IChatMessageService {
    private final ConversationService conversationService;
    private final UserService userService;
    private final ChatMessageRepository messageRepository;
    private final ConversationMapper conversationMapper;
    @Override
    public Message createMessage(MessageRequest messageRequest) {
        ConversationResponse conversation = conversationService.getConversationById(messageRequest.getConversationId());
        Message chatMessage = Message.builder()
                .createdAt(Instant.now())
                .content(messageRequest.getContent())
                .conversation(conversationMapper.mapConversationResponse(conversation))
                .image(messageRequest.getImage())
                .dateSent(Instant.now())
                .states(List.of(MessageState.DELIVERED))
                .sender(userService.findUserByUsername(messageRequest.getUsername()))
                .build();
        return messageRepository.save(chatMessage);
    }

    @Override
    public void removeMessageById(UUID id) {
        messageRepository.deleteById(id);
    }
}