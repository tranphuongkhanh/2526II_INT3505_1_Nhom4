package com.example.Rental.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.Rental.entity.Favorite;
import com.example.Rental.entity.FavoriteId;
import com.example.Rental.entity.Post;
import com.example.Rental.entity.User;
import com.example.Rental.repository.FavoriteRepository;
import com.example.Rental.repository.PostRepository;
import com.example.Rental.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    @Transactional
    public void addFavorite(String email, Long postId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        // 1. Kiểm tra nếu đã lưu rồi thì ném lỗi ngay lập tức
        if (favoriteRepository.existsByUserIdAndPostId(user.getId(), postId)) {
            throw new RuntimeException("Bài đăng này đã có trong danh sách yêu thích"); 
        }

        // 2. Nếu chưa lưu thì tiến hành lưu mới
        Favorite favorite = Favorite.builder()
                .id(new FavoriteId(user.getId(), postId))
                .user(user)
                .post(post)
                .build();
        favoriteRepository.save(favorite);
            
        // Optionally update favorite count on post
        if (post.getFavoriteCount() == null) {
            post.setFavoriteCount(0);
        }
        post.setFavoriteCount(post.getFavoriteCount() + 1);
        postRepository.save(post);
    }

    @Transactional
    public void removeFavorite(String email, Long postId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        FavoriteId favoriteId = new FavoriteId(user.getId(), postId);
        if (favoriteRepository.existsById(favoriteId)) {
            favoriteRepository.deleteById(favoriteId);
            
            // Optionally update favorite count on post
            if (post.getFavoriteCount() != null && post.getFavoriteCount() > 0) {
                post.setFavoriteCount(post.getFavoriteCount() - 1);
                postRepository.save(post);
            }
        }
    }

    @Transactional(readOnly = true)
    public Page<Post> getUserFavorites(String email, Pageable pageable) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return favoriteRepository.findByUserId(user.getId(), pageable)
                .map(Favorite::getPost);
    }
}
