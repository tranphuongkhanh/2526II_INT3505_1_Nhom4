package com.example.Rental.repository;

import com.example.Rental.entity.PostView;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostViewRepository extends JpaRepository<PostView, Long> {
    List<PostView> findByPostId(Long postId);
}
