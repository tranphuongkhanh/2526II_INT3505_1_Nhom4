package com.example.Rental.repository;

import com.example.Rental.entity.Favorite;
import com.example.Rental.entity.FavoriteId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FavoriteRepository extends JpaRepository<Favorite, FavoriteId> {
    List<Favorite> findByUserId(Long userId);
    boolean existsByUserIdAndPostId(Long userId, Long postId);
}
