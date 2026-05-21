package com.example.Rental.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.Rental.dto.request.PostSearchRequest;
import com.example.Rental.dto.response.OwnerPostResponse;
import com.example.Rental.dto.response.PostDetailResponse;
import com.example.Rental.dto.response.PostSummaryResponse;
import com.example.Rental.entity.Post;
import com.example.Rental.entity.PostView;
import com.example.Rental.entity.Room;
import com.example.Rental.entity.RoomImage;
import com.example.Rental.entity.User;
import com.example.Rental.exception.EntityNotFoundException;
import com.example.Rental.repository.PostRepository;
import com.example.Rental.repository.PostViewRepository;
import com.example.Rental.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final PostViewRepository postViewRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<PostSummaryResponse> searchPosts(PostSearchRequest request) {
        // Sắp xếp bài đăng mới nhất lên đầu
        Pageable pageable = PageRequest.of(request.getPage(), request.getSize(), Sort.by("createdAt").descending());
        
        Page<Post> posts = postRepository.searchGuestPosts(
                request.getKeyword(),
                request.getMinPrice(),
                request.getMaxPrice(),
                request.getRoomType(),
                request.getCity(),
                request.getDistrict(),
                pageable
        );

        return posts.map(this::mapToSummaryResponse);
    }

    @Transactional
    public PostDetailResponse getPostDetailAndIncrementView(Long postId) {
        // 1. Tăng view count trong bảng posts
        postRepository.incrementViewCount(postId);

        // 2. Ghi log vào bảng post_views (Dành cho Guest nên viewer_id = null)
        Post postRef = postRepository.getReferenceById(postId);
        PostView viewLog = PostView.builder()
                .post(postRef)
                .viewedAt(LocalDateTime.now())
                .build();
        postViewRepository.save(viewLog);

        // 3. Lấy thông tin bài đăng
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bài đăng ID: " + postId));

        // 4. Map dữ liệu trả về (Cộng 1 view cho logic hiển thị realtime)
        post.setViewCount(post.getViewCount() + 1); 
        return mapToDetailResponse(post);
    }

    // --- Helper methods để map Entity -> DTO ---

    private PostSummaryResponse mapToSummaryResponse(Post post) {
        Room room = post.getRoom();
        
        // Tìm ảnh thumbnail, nếu không có lấy ảnh đầu tiên
        String thumbUrl = room.getImages().stream()
                .filter(RoomImage::getIsThumbnail)
                .map(RoomImage::getImageUrl)
                .findFirst()
                .orElse(room.getImages().isEmpty() ? null : room.getImages().get(0).getImageUrl());

        return PostSummaryResponse.builder()
                .id(post.getId())
                .roomTitle(room.getTitle())
                .price(room.getPrice())
                .areaMq(room.getAreaMq())
                .city(room.getCity())
                .district(room.getDistrict())
                .thumbnailImage(thumbUrl)
                .viewCount(post.getViewCount())
                .createdAt(post.getCreatedAt())
                .build();
    }

    private PostDetailResponse mapToDetailResponse(Post post) {
        Room room = post.getRoom();
        
        List<String> images = room.getImages().stream()
                .map(RoomImage::getImageUrl)
                .collect(Collectors.toList());

        return PostDetailResponse.builder()
                .id(post.getId())
                .viewCount(post.getViewCount())
                .favoriteCount(post.getFavoriteCount())
                .startDate(post.getStartDate())
                .endDate(post.getEndDate())
                .roomId(room.getId())
                .title(room.getTitle())
                .description(room.getDescription())
                .price(room.getPrice())
                .areaMq(room.getAreaMq())
                .roomType(room.getRoomType())
                .address(room.getAddress())
                .ward(room.getWard())
                .district(room.getDistrict())
                .city(room.getCity())
                .hasWifi(room.getHasWifi())
                .hasAc(room.getHasAc())
                .hasFridge(room.getHasFridge())
                .hasParking(room.getHasParking())
                .hasPrivateWc(room.getHasPrivateWc())
                .hasSecurity(room.getHasSecurity())
                .imageUrls(images)
                .build();
    }

    @Transactional(readOnly = true)
    public List<OwnerPostResponse> getMyPosts(String email) {
        // 1. Tìm User bằng email
        User owner = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy user với email: " + email));

        // 2. Lấy danh sách bài đăng của user này
        List<Post> posts = postRepository.findByCreatedByIdOrderByCreatedAtDesc(owner.getId());

        // 3. Map sang DTO
        return posts.stream().map(post -> OwnerPostResponse.builder()
                .id(post.getId())
                .roomTitle(post.getRoom().getTitle())
                .status(post.getStatus())
                .rejectReason(post.getRejectReason())
                .listingFee(post.getListingFee())
                .startDate(post.getStartDate())
                .endDate(post.getEndDate())
                .viewCount(post.getViewCount())
                .favoriteCount(post.getFavoriteCount())
                .createdAt(post.getCreatedAt())
                .build()
        ).collect(Collectors.toList());
    }
}