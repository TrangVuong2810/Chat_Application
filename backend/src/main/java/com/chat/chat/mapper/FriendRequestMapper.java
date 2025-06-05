package com.chat.chat.mapper;

import com.chat.chat.dto.FriendRequestDto;
import com.chat.chat.model.FriendRequest;
import com.chat.chat.model.User;
import com.chat.chat.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class FriendRequestMapper {
    private final UserRepository userRepository;
    public FriendRequestDto toFriendRequestDto(FriendRequest friendRequest){
        User sender = userRepository.findByUsername(friendRequest.getSender().getUsername());
        User receiver = userRepository.findByUsername(friendRequest.getReceiver().getUsername());
        return FriendRequestDto.builder()
                .id(friendRequest.getId())
                .sender(sender)
                .receiver(receiver)
                .status(friendRequest.getStatus())
                .build();
    }
}
