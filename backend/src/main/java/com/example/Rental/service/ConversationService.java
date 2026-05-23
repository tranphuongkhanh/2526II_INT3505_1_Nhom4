package com.example.Rental.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.Rental.dto.request.CreateConversationRequest;
import com.example.Rental.dto.response.ConversationResponse;
import com.example.Rental.entity.Conversation;
import com.example.Rental.entity.User;
import com.example.Rental.exception.EntityNotFoundException;
import com.example.Rental.repository.ConversationRepository;
import com.example.Rental.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;

    // 1. Lấy danh sách hội thoại
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<ConversationResponse> getUserConversations(String email, Integer page, Integer size) {
        int pageNumber = (page != null && page > 0) ? page - 1 : 0;
        int pageSize = (size != null && size > 0) ? size : 20;
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(pageNumber, pageSize);

        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        org.springframework.data.domain.Page<Conversation> conversations = conversationRepository
                .findByUser1IdOrUser2IdOrderByLastMessageAtDesc(currentUser.getId(), currentUser.getId(), pageable);

        return conversations.map(conv -> mapToResponse(conv, currentUser));
    }

    // 2. Tạo mới hoặc lấy hội thoại đã có
    @Transactional
    public ConversationResponse getOrCreateConversation(String email, CreateConversationRequest request) {
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        User partner = userRepository.findById(request.getPartnerId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng để chat"));

        if (currentUser.getId().equals(partner.getId())) {
            throw new IllegalArgumentException("Bạn không thể tự tạo hội thoại với chính mình");
        }

        // Kiểm tra xem hội thoại (A, B) hoặc (B, A) đã tồn tại chưa
        Optional<Conversation> existing = conversationRepository.findByUser1IdAndUser2Id(currentUser.getId(), partner.getId());
        if (existing.isEmpty()) {
            existing = conversationRepository.findByUser1IdAndUser2Id(partner.getId(), currentUser.getId());
        }

        if (existing.isPresent()) {
            return mapToResponse(existing.get(), currentUser);
        }

        // Nếu chưa có thì tạo mới
        Conversation newConv = Conversation.builder()
                .user1(currentUser)
                .user2(partner)
                .lastMessageAt(LocalDateTime.now()) // Set mặc định để sort không bị lỗi null
                .build();
        
        newConv = conversationRepository.save(newConv);
        return mapToResponse(newConv, currentUser);
    }

    // 3. Lấy chi tiết một hội thoại
    @Transactional(readOnly = true)
    public ConversationResponse getConversationDetail(String email, Long conversationId) {
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hội thoại"));

        // Kiểm tra bảo mật: Chỉ những người tham gia mới được xem hội thoại này
        if (!conversation.getUser1().getId().equals(currentUser.getId()) &&
            !conversation.getUser2().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Bạn không có quyền xem hội thoại này");
        }

        return mapToResponse(conversation, currentUser);
    }

    // --- Helper Method: Ánh xạ chuẩn xác "Người kia" là ai ---
    private ConversationResponse mapToResponse(Conversation conversation, User currentUser) {
        // Nếu mình là user1 thì đối phương là user2, và ngược lại
        User partner = conversation.getUser1().getId().equals(currentUser.getId()) 
                ? conversation.getUser2() 
                : conversation.getUser1();

        return ConversationResponse.builder()
                .id(conversation.getId())
                .partnerId(partner.getId())
                .partnerName(partner.getFullName()) // Hoặc getUsername() tùy project bạn
                .partnerAvatar(partner.getAvatarUrl())
                .lastMessagePreview(conversation.getLastMessagePreview())
                .lastMessageAt(conversation.getLastMessageAt())
                .build();
    }
}