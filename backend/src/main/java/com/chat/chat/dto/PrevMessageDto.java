package com.chat.chat.dto;

import java.util.List;
import java.util.UUID;

public class PrevMessageDto {
    private int currentPage;
    private UUID firstUnreadMessage;
    private long unreadMessageCount;
    private List<MessageDto> chatMessages;
}
