package com.example.Rental.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.example.Rental.dto.response.CursorPageResponse;
import com.example.Rental.entity.Favorite;
import com.example.Rental.entity.FavoriteId;
import com.example.Rental.entity.Post;
import com.example.Rental.entity.User;
import com.example.Rental.exception.EntityNotFoundException;
import com.example.Rental.repository.FavoriteRepository;
import com.example.Rental.repository.PostRepository;
import com.example.Rental.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
public class FavoriteServiceTest {

    @Mock
    private FavoriteRepository favoriteRepository;

    @Mock
    private PostRepository postRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private FavoriteService favoriteService;

    private User user;
    private Post post;
    private String email = "test@example.com";
    private Long postId = 1L;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setEmail(email);

        post = new Post();
        post.setId(postId);
        post.setFavoriteCount(0);
    }

    @Test
    void addFavorite_Success() {
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(postRepository.findById(postId)).thenReturn(Optional.of(post));
        when(favoriteRepository.existsByUserIdAndPostId(user.getId(), postId)).thenReturn(false);

        favoriteService.addFavorite(email, postId);

        verify(favoriteRepository).save(any(Favorite.class));
        verify(postRepository).save(post);
        assertEquals(1, post.getFavoriteCount());
    }

    @Test
    void addFavorite_AlreadyExists() {
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(postRepository.findById(postId)).thenReturn(Optional.of(post));
        when(favoriteRepository.existsByUserIdAndPostId(user.getId(), postId)).thenReturn(true);

        RuntimeException exception = assertThrows(RuntimeException.class, () -> favoriteService.addFavorite(email, postId));
        assertEquals("Bài đăng này đã có trong danh sách yêu thích", exception.getMessage());
        verify(favoriteRepository, never()).save(any(Favorite.class));
    }

    @Test
    void addFavorite_UserNotFound() {
        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> favoriteService.addFavorite(email, postId));
    }

    @Test
    void removeFavorite_Success() {
        post.setFavoriteCount(1);
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(postRepository.findById(postId)).thenReturn(Optional.of(post));
        when(favoriteRepository.existsById(any(FavoriteId.class))).thenReturn(true);

        favoriteService.removeFavorite(email, postId);

        verify(favoriteRepository).deleteById(any(FavoriteId.class));
        verify(postRepository).save(post);
        assertEquals(0, post.getFavoriteCount());
    }

    @Test
    void getUserFavorites_Success() {
        Favorite favorite = new Favorite();
        favorite.setPost(post);
        Page<Favorite> page = new PageImpl<>(List.of(favorite));
        Pageable pageable = PageRequest.of(0, 10);

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(favoriteRepository.findByUserId(user.getId(), pageable)).thenReturn(page);

        Page<Post> result = favoriteService.getUserFavorites(email, pageable);

        assertEquals(1, result.getContent().size());
        assertEquals(postId, result.getContent().get(0).getId());
    }

    @Test
    void getUserFavoritesCursor_Success() {
        Favorite favorite1 = new Favorite();
        Post post1 = new Post();
        post1.setId(2L);
        favorite1.setPost(post1);

        Favorite favorite2 = new Favorite();
        Post post2 = new Post();
        post2.setId(1L);
        favorite2.setPost(post2);

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(favoriteRepository.findByUserIdOrderByPostIdDesc(eq(user.getId()), any(Pageable.class)))
                .thenReturn(List.of(favorite1, favorite2));

        CursorPageResponse<Post> response = favoriteService.getUserFavoritesCursor(email, null, 1);

        assertNotNull(response);
        assertEquals(1, response.getItems().size());
        assertEquals(post1.getId(), response.getItems().get(0).getId());
        assertEquals(post1.getId(), response.getNextCursor());
    }
}
