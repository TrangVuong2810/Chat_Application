package com.chat.chat.service.user;

import com.chat.chat.dto.FriendRequestDto;
import com.chat.chat.enums.FriendRequestStatus;
import com.chat.chat.enums.Role;
import com.chat.chat.enums.UserState;
import com.chat.chat.mapper.UserMapper;
import com.chat.chat.model.Conversation;
import com.chat.chat.model.User;
import com.chat.chat.payload.request.ConversationRequest;
import com.chat.chat.payload.response.FriendRequestResponse;
import com.chat.chat.repository.ConversationRepository;
import com.chat.chat.repository.UserRepository;
import com.chat.chat.security.jwt.JwtUtils;
import com.chat.chat.service.auth.AuthService;
import com.chat.chat.service.conversation.ConversationService;
import com.chat.chat.service.friendrequest.FriendRequestService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import jakarta.transaction.Transactional;

@Service
@RequiredArgsConstructor
public class UserService implements IUserService {
    //private final Faker faker;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final ConversationRepository conversationRepository;
    private final JwtUtils jwtUtils;
    private final FriendRequestService friendRequestService;

    private ConversationService conversationService;

    @Autowired
    public void setConversationService(@Lazy ConversationService conversationService) {
        this.conversationService = conversationService;
    }
    @Override
    public List<User> findAllUser() {
        return userMapper.mapperToUserIgnorePasswordField(userRepository.findAll());
    }

    @Override
    public User findUserByEmail(String email) {
        return userMapper.mapperToUserIgnorePasswordField(userRepository.findByEmail(email));
    }
    @Override
    public User findUserById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + id));
    }
    public User findUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    @Override
    public List<User> findUsersById(List<UUID> participants) {
        List<User> userList = new ArrayList<User>();
        participants.forEach(
                participant -> {
                    if(this.findUserById(participant) == null) {
                        throw new IllegalArgumentException("User not found");
                    }else{
                        userList.add(this.findUserById(participant));
                    }

                }
        );
        return userList;
    }

    @Override
    public List<User> findUsersInConversation(UUID conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId).get();
        return conversation.getParticipants();
    }

    @Override
    public UserDetails currentUser(HttpServletRequest request) {
        var jwt = jwtUtils.getJwtFromHeader(request);
        var email = jwtUtils.getEmailFromJwt(jwt);
        User currentUser = userRepository.findByEmail(email);
        if(currentUser != null){
            return userMapper.toUserDetails(currentUser);
        }
        return null;
    }

    @Override
    public boolean deleteUserByEmail(String email) {
        User user = userRepository.findByEmail(email);
        userRepository.delete(user);
        return !userRepository.existsByEmail(email);
    }

    @Override
    public List<User> getFriendList(UUID userId) {
        User user = userRepository.findById(userId).orElse(null);
        List<FriendRequestDto> friendRequests = friendRequestService.findFriendRequestsByUserId(userId);
        List<FriendRequestDto> acceptedRequests = friendRequests.stream().filter(fr -> fr.getStatus().equals(FriendRequestStatus.ACCEPTED)).toList();
        for(FriendRequestDto requestDto : acceptedRequests) {
            List<UUID> friendList = new ArrayList<>();
            friendList.add(requestDto.getSender().getId());
            friendList.add(requestDto.getReceiver().getId());
            if(!conversationService.participantsHasConversation(friendList)) {
                conversationService.createConversation(new ConversationRequest(Instant.now(),friendList));
            }
        }
        return acceptedRequests.stream()
                .map(request -> request.getReceiver().equals(user) ? request.getSender() : request.getReceiver()).collect(Collectors.toList());
    }

    @Override
    public User updateUserStateAndLastLogin(String username, UserState status, Instant date) {
        User existingUser = userRepository.findByUsername(username);
        if(status.equals(UserState.ONLINE)){
            existingUser.setUserState(UserState.ONLINE);
        } else if (status.equals(UserState.OFFLINE)) {
            existingUser.setUserState(UserState.OFFLINE);
        }
        existingUser.setLastOnline(date);

        return userRepository.save(existingUser);
    }

    @Override
    public User findByUsernameAndPassword(String username, String password) {
        //String encodedPassword = passwordEncoder.encode(password);
        //return userRepository.findByUsernameAndPassword(username, encodedPassword);
        return userRepository.findByUsernameAndPassword(username, password);
    }

    @Override
    public User updateNewPassword(UUID userId, String password) {
        User user = userRepository.findById(userId).orElseThrow( () -> new UsernameNotFoundException("User not found"));
        if(passwordEncoder.encode(user.getPassword()).equals(passwordEncoder.encode(password))){
            return null;
        }
        user.setPassword(passwordEncoder.encode(password));
        return userRepository.save(user);
    }

    @Override
    public List<FriendRequestResponse> getFriendRequestList(UUID userId) {
        List<FriendRequestDto> friendRequests = friendRequestService.findFriendRequestsByUserId(userId).stream().filter(friendRequest -> friendRequest.getReceiver().getId().equals(userId) && friendRequest.getStatus().equals(FriendRequestStatus.PENDING)).collect(Collectors.toList());
        return friendRequests.stream().map(friendRequestDto -> FriendRequestResponse.builder()
                .requestId(friendRequestDto.getId())
                .sender(friendRequestDto.getSender())
                .build()).distinct().toList();
    }

    @Transactional
    public User getOrCreateSystemUser() {
        User systemUser = findUserByUsername("system");

        if (systemUser == null) {
            // Create a system user if not exists
            systemUser = User.builder()
                    .fullName("System")
                    .username("system")
                    .password(passwordEncoder.encode("System@123"))  // Use a secure password
                    .email("system@yourapplication.com")
                    .roles(List.of(Role.ROLE_ADMIN, Role.ROLE_USER))
                    .build();

            systemUser = userRepository.save(systemUser);
        }

        return systemUser;
    }

    @Override
    public List<User> findNonFriendUsers(UUID userId) {
        List<User> allUsers = findAllUser();
        List<User> friends = getFriendList(userId);

        Set<UUID> friendIds = friends.stream()
                .map(User::getId)
                .collect(Collectors.toSet());

        List<FriendRequestDto> userFriendRequests = friendRequestService.findFriendRequestsByUserId(userId);

        Set<UUID> pendingRequestUserIds = userFriendRequests.stream()
                .filter(request -> request.getStatus() == FriendRequestStatus.PENDING)
                .map(request -> {
                    return userId.equals(request.getSender().getId()) ?
                            request.getReceiver().getId() :
                            request.getSender().getId();
                })
                .collect(Collectors.toSet());

        return allUsers.stream()
                .filter(user -> !user.getId().equals(userId) &&
                        !friendIds.contains(user.getId()) &&
                        !pendingRequestUserIds.contains(user.getId()) &&
                        !"system".equalsIgnoreCase(user.getUsername()))
                .collect(Collectors.toList());
    }


}