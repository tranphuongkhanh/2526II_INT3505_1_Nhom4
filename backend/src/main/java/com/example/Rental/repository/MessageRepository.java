package com.example.Rental.repository;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.Rental.entity.Message;

public interface MessageRepository extends JpaRepository<Message, Long> {
    
    // 1. Lấy tin nhắn mới nhất (khi chưa có cursor)
    List<Message> findByConversationIdOrderByCreatedAtDesc(Long conversationId, Pageable pageable);

    // 2. Lấy tin nhắn cũ hơn (dựa vào cursor)
    List<Message> findByConversationIdAndIdLessThanOrderByCreatedAtDesc(Long conversationId, Long cursorId, Pageable pageable);

    // 3. Đánh dấu đã đọc (Chỉ cập nhật những tin do NGƯỜI KIA gửi)
    @Modifying
    @Query("UPDATE Message m SET m.isRead = true WHERE m.conversation.id = :conversationId AND m.sender.id != :currentUserId AND m.isRead = false")
    void markMessagesAsRead(@Param("conversationId") Long conversationId, @Param("currentUserId") Long currentUserId);
}