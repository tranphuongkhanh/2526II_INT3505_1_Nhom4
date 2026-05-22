package com.example.Rental.repository;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.Rental.entity.Post;
import com.example.Rental.enums.PostStatus;
import com.example.Rental.enums.RoomType;

public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findByCreatedByIdOrderByCreatedAtDesc(Long userId);
    List<Post> findByStatusOrderByCreatedAtDesc(PostStatus status);

    @Query("SELECT p FROM Post p JOIN FETCH p.room r WHERE p.status = 'APPROVED' AND p.endDate > CURRENT_TIMESTAMP AND r.rentalStatus = 'AVAILABLE'")
    List<Post> findAllActivePosts();

    // 1. API Tìm kiếm cho Guest
    @Query("SELECT p FROM Post p JOIN p.room r WHERE " +
           "p.status = 'APPROVED' AND p.endDate > CURRENT_TIMESTAMP AND r.rentalStatus = 'AVAILABLE' AND " +
           "(:keyword IS NULL OR LOWER(r.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(r.address) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:minPrice IS NULL OR r.price >= :minPrice) AND " +
           "(:maxPrice IS NULL OR r.price <= :maxPrice) AND " +
           "(:roomType IS NULL OR r.roomType = :roomType) AND " +
           "(:city IS NULL OR r.city = :city) AND " +
           "(:district IS NULL OR r.district = :district)")
    Page<Post> searchGuestPosts(@Param("keyword") String keyword,
                                @Param("minPrice") BigDecimal minPrice,
                                @Param("maxPrice") BigDecimal maxPrice,
                                @Param("roomType") RoomType roomType,
                                @Param("city") String city,
                                @Param("district") String district,
                                Pageable pageable);

    // 2. Cập nhật view_count trực tiếp dưới DB để tránh lỗi đồng bộ
    @Modifying
    @Query("UPDATE Post p SET p.viewCount = p.viewCount + 1 WHERE p.id = :postId")
    void incrementViewCount(@Param("postId") Long postId);

    Page<Post> findByStatus(PostStatus status, Pageable pageable);
}

