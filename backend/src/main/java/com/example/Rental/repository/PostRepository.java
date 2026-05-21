package com.example.Rental.repository;

import com.example.Rental.entity.Post;
import com.example.Rental.enums.PostStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findByCreatedByIdOrderByCreatedAtDesc(Long userId);
    List<Post> findByStatusOrderByCreatedAtDesc(PostStatus status);

    @Query("SELECT p FROM Post p JOIN FETCH p.room r WHERE p.status = 'APPROVED' AND p.endDate > CURRENT_TIMESTAMP AND r.rentalStatus = 'AVAILABLE'")
    List<Post> findAllActivePosts();
}
