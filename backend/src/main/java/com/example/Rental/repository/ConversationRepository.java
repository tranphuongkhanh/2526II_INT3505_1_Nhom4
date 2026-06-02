package com.example.Rental.repository;

import com.example.Rental.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    Optional<Conversation> findByUser1IdAndUser2Id(Long user1Id, Long user2Id);
    org.springframework.data.domain.Page<Conversation> findByUser1IdOrUser2IdOrderByLastMessageAtDesc(Long user1Id, Long user2Id, org.springframework.data.domain.Pageable pageable);

    // Cursor-based pagination
    List<Conversation> findByUser1IdOrUser2IdOrderByIdDesc(Long user1Id, Long user2Id, org.springframework.data.domain.Pageable pageable);
    List<Conversation> findByUser1IdOrUser2IdAndIdLessThanOrderByIdDesc(Long user1Id, Long user2Id, Long cursor, org.springframework.data.domain.Pageable pageable);
}
