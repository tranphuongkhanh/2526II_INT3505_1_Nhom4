package com.example.Rental.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.Rental.dto.request.SendMessageRequest;
import com.example.Rental.dto.response.CursorPageResponse;
import com.example.Rental.dto.response.MessageResponse;
import com.example.Rental.entity.Conversation;
import com.example.Rental.entity.Message;
import com.example.Rental.entity.User;
import com.example.Rental.exception.EntityNotFoundException;
import com.example.Rental.repository.ConversationRepository;
import com.example.Rental.repository.MessageRepository;
import com.example.Rental.repository.UserRepository;
import lombok.RequiredArgsConstructor;

import org.springframework.messaging.simp.SimpMessagingTemplate;
// ... (imports are merged below)

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // 1. Lấy danh sách tin nhắn (Cursor-based)
    @Transactional(readOnly = true)
    public CursorPageResponse<MessageResponse> getMessages(String email, Long conversationId, Long cursor, int limit) {
        User currentUser = getUser(email);
        Conversation conversation = getValidConversation(conversationId, currentUser.getId());

        Pageable pageable = PageRequest.of(0, limit);
        List<Message> messages;

        if (cursor == null) {
            messages = messageRepository.findByConversationIdOrderByCreatedAtDesc(conversation.getId(), pageable);
        } else {
            messages = messageRepository.findByConversationIdAndIdLessThanOrderByCreatedAtDesc(conversation.getId(), cursor, pageable);
        }

        List<MessageResponse> items = messages.stream().map(this::mapToResponse).collect(Collectors.toList());
        
        // Xác định cursor tiếp theo (là ID của tin nhắn cuối cùng trong danh sách trả về)
        Long nextCursor = items.size() == limit ? items.get(items.size() - 1).getId() : null;

        return new CursorPageResponse<>(items, nextCursor);
    }

    // 2. Gửi tin nhắn mới
    @Transactional
    public MessageResponse sendMessage(String email, Long conversationId, SendMessageRequest request) {
        User currentUser = getUser(email);
        Conversation conversation = getValidConversation(conversationId, currentUser.getId());

        // Tạo tin nhắn
        Message message = Message.builder()
                .conversation(conversation)
                .sender(currentUser)
                .content(request.getContent())
                .isRead(false)
                .build();
        message = messageRepository.save(message);

        // Cập nhật lại thông tin hiển thị của Conversation (để sort ngoài màn hình danh sách)
        conversation.setLastMessageAt(LocalDateTime.now());
        // Cắt ngắn tin nhắn làm preview (hiển thị ngoài list)
        String preview = request.getContent();
        if (preview.length() > 50) preview = preview.substring(0, 47) + "...";
        conversation.setLastMessagePreview(preview);
        
        conversationRepository.save(conversation);

        MessageResponse response = mapToResponse(message);
        
        // Broadcast via WebSocket
        User recipient = conversation.getUser1().getId().equals(currentUser.getId()) ? conversation.getUser2() : conversation.getUser1();
        messagingTemplate.convertAndSendToUser(recipient.getEmail(), "/queue/messages", response);
        // Also send to the sender's other potential sessions
        messagingTemplate.convertAndSendToUser(currentUser.getEmail(), "/queue/messages", response);

        return response;
    }

    // 3. Đánh dấu đã đọc
    @Transactional
    public void markAsRead(String email, Long conversationId) {
        User currentUser = getUser(email);
        // Kiểm tra quyền
        Conversation conversation = getValidConversation(conversationId, currentUser.getId());
        
        // Update database (Chỉ update tin của đối phương gửi)
        int updatedCount = messageRepository.markMessagesAsRead(conversationId, currentUser.getId());
        
        if (updatedCount > 0) {
            User partner = conversation.getUser1().getId().equals(currentUser.getId()) ? conversation.getUser2() : conversation.getUser1();
            MessageResponse readReceipt = MessageResponse.builder()
                    .type("READ_RECEIPT")
                    .conversationId(conversationId)
                    .build();
            messagingTemplate.convertAndSendToUser(partner.getEmail(), "/queue/messages", readReceipt);
        }
    }

    // --- Helper Methods ---
    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
    }

    private Conversation getValidConversation(Long conversationId, Long currentUserId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hội thoại"));

        // Bảo mật: Đảm bảo user gọi API phải nằm trong hội thoại này
        if (!conversation.getUser1().getId().equals(currentUserId) &&
            !conversation.getUser2().getId().equals(currentUserId)) {
            throw new AccessDeniedException("Bạn không có quyền truy cập hội thoại này");
        }
        return conversation;
    }

    private MessageResponse mapToResponse(Message message) {
        return MessageResponse.builder()
                .id(message.getId())
                .type("MESSAGE")
                .senderId(message.getSender().getId())
                .senderName(message.getSender().getFullName())
                .senderAvatarUrl(message.getSender().getAvatarUrl())
                .content(message.getContent())
                .isRead(message.getIsRead())
                .createdAt(message.getCreatedAt())
                .conversationId(message.getConversation().getId())
                .build();
    }
}