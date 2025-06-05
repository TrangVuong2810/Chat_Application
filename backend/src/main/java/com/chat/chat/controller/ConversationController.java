package com.chat.chat.controller;

import com.chat.chat.enums.UserState;
import com.chat.chat.model.Conversation;
import com.chat.chat.model.User;
import com.chat.chat.payload.request.ConversationRequest;
import com.chat.chat.payload.request.MessageRequest;
import com.chat.chat.payload.response.ConversationResponse;
import com.chat.chat.payload.response.MessageResponse;
import com.chat.chat.payload.response.ResponseObject;
import com.chat.chat.payload.response.UserResponseSecure;
import com.chat.chat.repository.ConversationRepository;
import com.chat.chat.service.chat.ChatService;
import com.chat.chat.service.chatmessage.ChatMessageService;
import com.chat.chat.service.conversation.ConversationService;
import com.chat.chat.service.user.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.*;
import java.security.Principal;
import java.util.List;
import java.util.UUID;
import java.time.Instant;
import java.util.stream.Collectors;

@RestController
@RequestMapping(path = "/api/conversation")
@RequiredArgsConstructor
@Slf4j
public class ConversationController {
    private final UserService userService;
    private final ChatService chatService;
    private final ConversationService conversationService;
    private final ConversationRepository conversationRepository;
    private final ChatMessageService messageService;
    private final org.springframework.messaging.simp.SimpMessagingTemplate simpMessagingTemplate;
    @GetMapping()
    public ResponseEntity<?> findAllConversations(){
        try {
            List<ConversationResponse> conversations = conversationService.getAllConversations();
            List<Map<String, Object>> enhancedConversations = conversations.stream()
                    .map(conversation -> {
                        Map<String, Object> enhancedConversation = new HashMap<>();
                        enhancedConversation.put("id", conversation.getId());
                        enhancedConversation.put("dateStarted", conversation.getDateStarted());
                        enhancedConversation.put("messages", conversation.getMessages());
                        enhancedConversation.put("groupConversation", conversation.isGroupConversation());
                        enhancedConversation.put("dateUpdate", conversation.getDateUpdate());

                        if (conversation.isGroupConversation()) {
                            enhancedConversation.put("groupName", conversation.getGroupName());
                        }

                        // Add enhanced participants if available
                        if (conversation.getParticipants() != null) {
                            List<Map<String, Object>> enhancedParticipants = conversation.getParticipants().stream()
                                    .map(participant -> {
                                        Map<String, Object> enhancedParticipant = new HashMap<>();
                                        enhancedParticipant.put("user", participant);

                                        // Add special flag for system user
                                        boolean isSystemUser = "system".equals(participant.getUsername());
                                        enhancedParticipant.put("isSystemUser", isSystemUser);

                                        // Add more participant metadata
                                        enhancedParticipant.put("joinedAt", Instant.now());

                                        return enhancedParticipant;
                                    })
                                    .collect(Collectors.toList());

                            enhancedConversation.put("participants", enhancedParticipants);
                        }

                        return enhancedConversation;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(new ResponseObject(200, "Fetch conversations successfully", conversations));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(new ResponseObject(404, "Conversations not found")) ;

        }
    }
    @GetMapping("/by-userId/{userId}")
    public ResponseEntity<?> findAllByUserId(@PathVariable String userId){
        try {
            List<ConversationResponse> responseList = conversationService.getAllConversationsByUserId(UUID.fromString(userId));

            // Transform each conversation to include enhanced participant info
            List<Map<String, Object>> enhancedConversations = responseList.stream()
                    .map(conversation -> {
                        Map<String, Object> enhancedConversation = new HashMap<>();
                        enhancedConversation.put("id", conversation.getId());
                        enhancedConversation.put("dateStarted", conversation.getDateStarted());
                        enhancedConversation.put("groupConversation", conversation.isGroupConversation());
                        enhancedConversation.put("dateUpdate", conversation.getDateUpdate());

                        if (conversation.isGroupConversation()) {
                            enhancedConversation.put("groupName", conversation.getGroupName());
                        }

                        if (conversation.getMessages() != null) {
                            enhancedConversation.put("messages", conversation.getMessages());
                        }

                        // Add enhanced participants if available
                        if (conversation.getParticipants() != null) {
                            List<Map<String, Object>> enhancedParticipants = conversation.getParticipants().stream()
                                    .filter(Objects::nonNull)
                                    .filter(participant -> !"system".equals(participant.getUsername()))
                                    .map(participant -> {
                                        Map<String, Object> enhancedParticipant = new HashMap<>();
                                        enhancedParticipant.put("user", participant);
                                        enhancedParticipant.put("isSystemUser", false);
                                        enhancedParticipant.put("joinedAt", Instant.now());
                                        return enhancedParticipant;
                                    })
                                    .collect(Collectors.toList());

                            enhancedConversation.put("participants", enhancedParticipants);
                        }

                        return enhancedConversation;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(new ResponseObject(200, "Fetch conversations successfully", enhancedConversations));
        } catch (IllegalArgumentException e) {
            // Handle the specific exception for user not found
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ResponseObject(404, "User not found: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Error fetching conversations", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ResponseObject(500, "Error fetching conversations: " + e.getMessage()));
        }

    }
    @PutMapping("/by-id/{id}")
    public ResponseEntity<?> updateConversationById(@PathVariable String id){
        Conversation conversation = conversationService.updateConversationById(UUID.fromString(id));
        if(conversation == null){
            return ResponseEntity.badRequest().body(new ResponseObject(400, "Conversation not found"));
        }
        return ResponseEntity.ok().body(new ResponseObject(200,"Fetch conversation successfully", conversation));

    }
    @GetMapping("/by-id/{id}")
    public ResponseEntity<?> findConversationById(@PathVariable String id){
        ConversationResponse conversation = conversationService.getConversationById(UUID.fromString(id));
        if(conversation == null){
            return ResponseEntity.badRequest().body(new ResponseObject(400, "Conversation not found"));
        }

        // Create enhanced response with additional participant information
        Map<String, Object> enhancedConversation = new HashMap<>();
        enhancedConversation.put("id", conversation.getId());
        enhancedConversation.put("dateStarted", conversation.getDateStarted());
        enhancedConversation.put("groupConversation", conversation.isGroupConversation());
        enhancedConversation.put("dateUpdate", conversation.getDateUpdate());

        if (conversation.isGroupConversation()) {
            enhancedConversation.put("groupName", conversation.getGroupName());
        }

        // Ensure correct message mapping if messages exist
        if (conversation.getMessages() != null) {
            enhancedConversation.put("messages", conversation.getMessages());
        }

        // Add enhanced participants if available, filtering out system user
        if (conversation.getParticipants() != null) {
            List<Map<String, Object>> enhancedParticipants = conversation.getParticipants().stream()
                    .filter(participant -> !"system".equals(participant.getUsername()))
                    .map(participant -> {
                        Map<String, Object> enhancedParticipant = new HashMap<>();
                        enhancedParticipant.put("user", participant);
                        enhancedParticipant.put("isSystemUser", false);
                        enhancedParticipant.put("joinedAt", Instant.now());
                        return enhancedParticipant;
                    })
                    .collect(Collectors.toList());

            enhancedConversation.put("participants", enhancedParticipants);
        }

        return ResponseEntity.ok().body(new ResponseObject(200,"Fetch conversation successfully", enhancedConversation));

    }
    @GetMapping("/message/by-id/{id}")
    public ResponseEntity<?> getMessageListByConversationId(@PathVariable String id){
        List<MessageResponse> chatMessages = conversationService.getMessages(id);
        if(chatMessages == null){
            return ResponseEntity.badRequest().body(new ResponseObject(400, "chatMessages not found"));
        }
        return ResponseEntity.ok().body(new ResponseObject(200,"Fetch chatMessages successfully", chatMessages));

    }

    @PostMapping("/send-message/{conversationId}")
    public ResponseEntity<MessageResponse> sendMessage(
            @PathVariable UUID conversationId,
            @RequestBody MessageRequest message
    ) {
        MessageResponse sentMessage = conversationService.sendMessage(conversationId, message);
        return new ResponseEntity<>(sentMessage, HttpStatus.CREATED);
    }
    @PostMapping("/create")
    public ResponseEntity<?> createConversation(@RequestBody ConversationRequest conversationRequest)  {
        log.info(conversationRequest.toString());
        var conversation = conversationService.createConversation(conversationRequest);
        if(conversation == null) {
            return ResponseEntity.badRequest().body(new ResponseObject(500, "Create failed"));
        }
        return ResponseEntity.ok(new ResponseObject(201, "Create new conversation successfully", conversation));
    }

    @MessageMapping("/private.chat")
    public void sendPrivateMessage(@Payload MessageRequest messageRequest) {
        try {
            if (messageRequest.getConversationId() == null) {
                log.error("Conversation ID is null in private message request");
                return;
            }

            UUID conversationId = messageRequest.getConversationId();
            if (!conversationRepository.existsById(conversationId)) {
                throw new IllegalArgumentException("Conversation not found");
            }

            chatService.processPrivateMessage(messageRequest);
        } catch (IllegalArgumentException e) {
            log.error("Invalid conversation: {}, error: {}",
                    messageRequest.getConversationId(), e.getMessage());

            // Notify the sender about the error
            if (messageRequest.getUsername() != null) {
                Map<String, Object> errorMessage = new HashMap<>();
                errorMessage.put("type", "ERROR");
                errorMessage.put("message", "Invalid conversation");

                simpMessagingTemplate.convertAndSendToUser(
                        messageRequest.getUsername(),
                        "/queue/messages",
                        errorMessage
                );
            }
        }
    }
    @MessageMapping("/test")
    public void handleTestMessage(@Payload String testMessage, Principal principal) {
        log.info("TEST MESSAGE RECEIVED: " + testMessage);
        log.info("From user: " + (principal != null ? principal.getName() : "unknown"));

        if (principal != null) {
            String username = principal.getName();
            log.info("Sending test echo to: " + username);
            simpMessagingTemplate.convertAndSendToUser(username, "/private-messages", "TEST ECHO: " + testMessage);
            log.info("Test echo sent successfully");
        }
    }
    @DeleteMapping("/remove-message-by-id/{id}")
    public void removeMessage(@PathVariable String id){
        messageService.removeMessageById(UUID.fromString(id));
    }

    @PostMapping("/create-group")
    public ResponseEntity<?> createGroupConversation(
            @RequestBody ConversationRequest conversationRequest,
            @RequestParam(required = false) String groupName) {
        log.info("Creating group conversation: {}", conversationRequest);

        // Validate we have more than 2 participants
        if (conversationRequest.getParticipants().size() < 3) {
            return ResponseEntity.badRequest().body(
                    new ResponseObject(400, "Group chats require at least 3 participants"));
        }

        // Create group conversation
        var conversation = conversationService.createGroupConversation(conversationRequest, groupName);
        if (conversation == null) {
            return ResponseEntity.badRequest().body(new ResponseObject(500, "Create group failed"));
        }

        return ResponseEntity.ok(new ResponseObject(201, "Created group conversation successfully", conversation));
    }
    @MessageMapping("/group.chat")
    public void sendGroupMessage(@Payload MessageRequest messageRequest, Principal principal) {
        log.info("Received group message: {}", messageRequest);

        // Get conversation
        UUID conversationId = UUID.fromString(String.valueOf(messageRequest.getConversationId()));
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        if (!conversation.isGroupConversation()) {
            log.warn("Attempted to use group chat endpoint for non-group conversation");
            return;
        }

        MessageResponse savedMessage = conversationService.sendMessage(conversationId, messageRequest);

        MessageResponse detachedMessage = new MessageResponse(
                savedMessage.getId(),
                null, // This will be set later with setSender()
                savedMessage.getContent(),
                savedMessage.getImage(),
                savedMessage.getConversationId(),
                savedMessage.getDateSent(),
                savedMessage.getDateDelivered(),
                savedMessage.getDateRead(),
                savedMessage.getStates()
        );

        // Only include necessary user information without the roles
        if (savedMessage.getSender() != null) {
            detachedMessage.setSender(new UserResponseSecure(
                    savedMessage.getSender().getId(),
                    savedMessage.getSender().getFullName(),
                    savedMessage.getSender().getUsername(),
                    savedMessage.getSender().getProfilePicture(),
                    savedMessage.getSender().getEmail(),
                    null,
                    savedMessage.getSender().getUserState(),
                    savedMessage.getSender().getLastOnline(),
                    savedMessage.getSender().getPhone()
            ));
        }

        // Send to all participants
        for (User participant : conversation.getParticipants()) {
            if (!participant.getUsername().equals(messageRequest.getUsername())) {
                simpMessagingTemplate.convertAndSendToUser(
                        participant.getUsername(),
                        "/queue/messages",
                        detachedMessage
                );
            }
        }
    }

    @PostMapping("/group/{conversationId}/add-members")
    public ResponseEntity<?> addGroupMembers(
            @PathVariable UUID conversationId,
            @RequestBody List<UUID> newMemberIds) {
        try {
            ConversationResponse updated = conversationService.addGroupMembers(conversationId, newMemberIds);

            // Send WebSocket notifications and save system messages
            for (UUID memberId : newMemberIds) {
                User addedUser = userService.findUserById(memberId);
                if (addedUser != null) {
                    // Create system message
                    MessageRequest systemMessage = new MessageRequest("system", conversationId,
                            addedUser.getFullName() + " joined the group", null);

                    // Save the system message
                    MessageResponse savedSystemMessage = conversationService.sendMessage(conversationId, systemMessage);

                    // Notify all group members
                    for (User participant : updated.getParticipants()) {
                        Map<String, Object> memberJoinedMessage = new HashMap<>();
                        memberJoinedMessage.put("type", "MEMBER_JOINED");
                        memberJoinedMessage.put("conversationId", conversationId.toString());
                        memberJoinedMessage.put("memberName", addedUser.getFullName());
                        memberJoinedMessage.put("memberId", addedUser.getId().toString());

                        simpMessagingTemplate.convertAndSendToUser(
                                participant.getUsername(),
                                "/queue/messages",
                                memberJoinedMessage
                        );
                    }
                }
            }

            return ResponseEntity.ok(new ResponseObject(200, "Members added successfully", updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ResponseObject(400, e.getMessage()));
        }
    }

    @PostMapping("/group/{conversationId}/remove-member/{memberId}")
    public ResponseEntity<?> removeGroupMember(
            @PathVariable UUID conversationId,
            @PathVariable UUID memberId) {
        try {
            // Get the user info before removing them
            User removedUser = userService.findUserById(memberId);

            // Get conversation participants before removal
            ConversationResponse conversation = conversationService.getConversationById(conversationId);

            // Create system message for user leaving
            if (removedUser != null) {
                MessageRequest systemMessage = new MessageRequest("system", conversationId,
                        removedUser.getFullName() + " left the group", null);

                // Save the system message
                MessageResponse savedSystemMessage = conversationService.sendMessage(conversationId, systemMessage);
            }

            ConversationResponse updated = conversationService.removeGroupMembers(conversationId, List.of(memberId));

            if (removedUser != null) {
                // Notify remaining group members about the removed member
                for (User participant : updated.getParticipants()) {
                    Map<String, Object> memberLeftMessage = new HashMap<>();
                    memberLeftMessage.put("type", "MEMBER_LEFT");
                    memberLeftMessage.put("conversationId", conversationId.toString());
                    memberLeftMessage.put("memberName", removedUser.getFullName());
                    memberLeftMessage.put("memberId", removedUser.getId().toString());

                    simpMessagingTemplate.convertAndSendToUser(
                            participant.getUsername(),
                            "/queue/messages",
                            memberLeftMessage
                    );
                }
            }

            return ResponseEntity.ok(new ResponseObject(200, "Member removed successfully", updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ResponseObject(400, e.getMessage()));
        }
    }

    @GetMapping("/group-conversations")
    public ResponseEntity<?> getAllGroupConversations() {
        try {
            List<ConversationResponse> responseList = conversationService.getAllGroupConversations();

            List<Map<String, Object>> enhancedConversations = responseList.stream()
                    .map(conversation -> {
                        Map<String, Object> enhancedConversation = new HashMap<>();
                        enhancedConversation.put("id", conversation.getId());
                        enhancedConversation.put("dateStarted", conversation.getDateStarted());
                        enhancedConversation.put("groupConversation", conversation.isGroupConversation());
                        enhancedConversation.put("dateUpdate", conversation.getDateUpdate());

                        if (conversation.isGroupConversation()) {
                            enhancedConversation.put("groupName", conversation.getGroupName());
                        }

                        // Include messages if they exist
                        if (conversation.getMessages() != null) {
                            enhancedConversation.put("messages", conversation.getMessages());
                        }

                        // Add enhanced participants, filtering out system user
                        if (conversation.getParticipants() != null) {
                            List<Map<String, Object>> enhancedParticipants = conversation.getParticipants().stream()
                                    .filter(participant -> !"system".equals(participant.getUsername()))
                                    .map(participant -> {
                                        Map<String, Object> enhancedParticipant = new HashMap<>();
                                        enhancedParticipant.put("user", participant);
                                        enhancedParticipant.put("isSystemUser", false);
                                        enhancedParticipant.put("joinedAt", Instant.now());
                                        return enhancedParticipant;
                                    })
                                    .collect(Collectors.toList());

                            enhancedConversation.put("participants", enhancedParticipants);
                        }

                        return enhancedConversation;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(new ResponseObject(200, "Fetch group conversations successfully", enhancedConversations));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(new ResponseObject(404, ex.getMessage()));
        }
    }

    @PostMapping("/group/{conversationId}/join")
    public ResponseEntity<?> joinGroup(
            @PathVariable UUID conversationId,
            Principal principal) {
        try {
            // Get current user from authentication
            User currentUser = userService.findUserByUsername(principal.getName());
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ResponseObject(401, "User not authenticated"));
            }

            // Check if conversation exists and is a group
            ConversationResponse conversation = conversationService.getConversationById(conversationId);
            if (conversation == null || !conversation.isGroupConversation()) {
                return ResponseEntity.badRequest()
                        .body(new ResponseObject(400, "Invalid group conversation"));
            }

            // Check if user is already a member
            boolean isAlreadyMember = conversation.getParticipants().stream()
                    .anyMatch(p -> p.getId().equals(currentUser.getId()));

            if (isAlreadyMember) {
                return ResponseEntity.ok(new ResponseObject(200, "User is already a member", conversation));
            }

            // Add the user to the group
            ConversationResponse updated = conversationService.addGroupMembers(
                    conversationId, List.of(currentUser.getId()));

            // Create and save system message about the join
            MessageRequest systemMessage = new MessageRequest(
                    "system",
                    conversationId,
                    currentUser.getFullName() + " joined the group",
                    null
            );
            conversationService.sendMessage(conversationId, systemMessage);

            // Notify all members about the new join
            for (User participant : updated.getParticipants()) {
                Map<String, Object> memberJoinedMessage = new HashMap<>();
                memberJoinedMessage.put("type", "MEMBER_JOINED");
                memberJoinedMessage.put("conversationId", conversationId.toString());
                memberJoinedMessage.put("memberName", currentUser.getFullName());
                memberJoinedMessage.put("memberId", currentUser.getId().toString());

                simpMessagingTemplate.convertAndSendToUser(
                        participant.getUsername(),
                        "/queue/messages",
                        memberJoinedMessage
                );
            }

            return ResponseEntity.ok(new ResponseObject(200, "Successfully joined group", updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ResponseObject(400, e.getMessage()));
        }
    }
    @MessageMapping("/join.conversation")
    public void joinConversation(@Payload String conversationId, Principal principal) {
        log.info("User {} joined conversation: {}",
                principal != null ? principal.getName() : "unknown",
                conversationId);

        // Send current online users to the newly joined user
        chatService.broadcastOnlineUsers();
    }
    @MessageMapping("/request-online-users")
    public void requestOnlineUsers(@Payload String conversationId, Principal principal) {
        try {
            UUID conversationUuid = UUID.fromString(conversationId);
            broadcastConversationOnlineUsers(conversationUuid);
        } catch (IllegalArgumentException e) {
            log.error("Invalid conversation ID format: {}", conversationId);
        }
    }

    public void broadcastConversationOnlineUsers(UUID conversationId) {
        // Get participants of this conversation
        ConversationResponse conversation = conversationService.getConversationById(conversationId);
        if (conversation == null || conversation.getParticipants().isEmpty()) {
            return;
        }

        // Filter participants who are online
        List<String> onlineUserIds = conversation.getParticipants().stream()
                .filter(user -> UserState.ONLINE.equals(user.getUserState()))
                .map(user -> user.getId().toString())
                .collect(Collectors.toList());

        log.info("Broadcasting online users for conversation {}: {}", conversationId, onlineUserIds);

        // Create notification message
        Map<String, Object> onlineUsersMessage = new HashMap<>();
        onlineUsersMessage.put("type", "ONLINE_USERS");
        onlineUsersMessage.put("metadata", Map.of("USERS", onlineUserIds)); // Don't call toString()

        // Send to all conversation participants
        for (User participant : conversation.getParticipants()) {
            simpMessagingTemplate.convertAndSendToUser(
                    participant.getUsername(),
                    "/queue/messages",
                    onlineUsersMessage
            );
        }
    }
}