package com.example.Rental.repository;

import com.example.Rental.entity.Favorite;
import com.example.Rental.entity.FavoriteId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface FavoriteRepository extends JpaRepository<Favorite, FavoriteId> {
    @EntityGraph(attributePaths = {"post", "post.room", "post.room.images"})
    Page<Favorite> findByUserId(Long userId, Pageable pageable);

    boolean existsByUserIdAndPostId(Long userId, Long postId);
}
