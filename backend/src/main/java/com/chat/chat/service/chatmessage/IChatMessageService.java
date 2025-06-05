package com.chat.chat.service.chatmessage;

import com.chat.chat.model.Message;
import com.chat.chat.payload.request.MessageRequest;

import java.util.UUID;

public interface IChatMessageService {
    Message createMessage(MessageRequest messageRequest);
    void removeMessageById(UUID id);
}
