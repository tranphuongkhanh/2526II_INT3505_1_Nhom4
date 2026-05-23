package com.example.Rental.controller;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.Rental.dto.response.ApiResponse;
import com.example.Rental.dto.response.FavoriteListResponse;
import com.example.Rental.dto.response.PaginationMetaResponse;
import com.example.Rental.dto.response.PostSummaryResponse;
import com.example.Rental.entity.Post;
import com.example.Rental.service.FavoriteService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;

    @PostMapping("/posts/{postId}/favorites")
    public ResponseEntity<ApiResponse<Void>> addFavorite(@PathVariable Long postId, Principal principal) {
        favoriteService.addFavorite(principal.getName(), postId);
        return ResponseEntity.ok(ApiResponse.ok("Favorite added", null));
    }

    @DeleteMapping("/posts/{postId}/favorites")
    public ResponseEntity<ApiResponse<Void>> removeFavorite(@PathVariable Long postId, Principal principal) {
        favoriteService.removeFavorite(principal.getName(), postId);
        return ResponseEntity.ok(ApiResponse.ok("Favorite removed", null));
    }

    @GetMapping("/users/me/favorites")
    public ResponseEntity<ApiResponse<FavoriteListResponse>> getUserFavorites(
            Principal principal,
            @RequestParam(required = false, defaultValue = "1") Integer page,
            @RequestParam(required = false, defaultValue = "10") Integer limit) {
        

        
        Pageable pageable = PageRequest.of(page - 1, limit);
        Page<Post> favoritePage = favoriteService.getUserFavorites(principal.getName(), pageable);
        
        List<PostSummaryResponse> items = favoritePage.getContent().stream()
                .map(this::mapToSummaryResponse)
                .collect(Collectors.toList());
                
        PaginationMetaResponse meta = PaginationMetaResponse.builder()
                .total(favoritePage.getTotalElements())
                .page(page)
                .limit(limit)
                .build();
                
        FavoriteListResponse response = FavoriteListResponse.builder()
                .items(items)
                .meta(meta)
                .build();
                
        return ResponseEntity.ok(ApiResponse.ok("Favorites retrieved", response));
    }

    private PostSummaryResponse mapToSummaryResponse(Post post) {
        if (post == null || post.getRoom() == null) return null;

        String thumbnail = null;
        if (post.getRoom().getImages() != null && !post.getRoom().getImages().isEmpty()) {
            thumbnail = post.getRoom().getImages().stream()
                .filter(img -> img.getIsThumbnail() != null && img.getIsThumbnail())
                .map(img -> img.getImageUrl())
                .findFirst()
                .orElse(post.getRoom().getImages().get(0).getImageUrl());
        }

        return PostSummaryResponse.builder()
                .id(post.getId())
                .roomTitle(post.getRoom().getTitle())
                .price(post.getRoom().getPrice())
                .areaMq(post.getRoom().getAreaMq().doubleValue())
                .city(post.getRoom().getCity())
                .district(post.getRoom().getDistrict())
                .thumbnailImage(thumbnail)
                .viewCount(post.getViewCount())
                .createdAt(post.getCreatedAt())
                .build();
    }
}