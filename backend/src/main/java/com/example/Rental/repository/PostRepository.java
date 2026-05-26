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
    Page<Post> findByCreatedById(Long userId, Pageable pageable);
    List<Post> findByStatusOrderByCreatedAtDesc(PostStatus status);

    @Query("SELECT p FROM Post p JOIN FETCH p.room r WHERE p.status = 'APPROVED' AND p.endDate > CURRENT_TIMESTAMP")
    List<Post> findAllActivePosts();

    long countByStatus(PostStatus status);

    // 1. API Tìm kiếm cho Guest
    @Query("SELECT p FROM Post p JOIN p.room r WHERE " +
           "p.status = 'APPROVED' AND p.endDate > CURRENT_TIMESTAMP AND " +
           "(cast(:keyword as string) IS NULL OR LOWER(r.title) LIKE LOWER(CONCAT('%', cast(:keyword as string), '%')) OR LOWER(r.address) LIKE LOWER(CONCAT('%', cast(:keyword as string), '%'))) AND " +
           "(cast(:minPrice as string) IS NULL OR r.price >= :minPrice) AND " +
           "(cast(:maxPrice as string) IS NULL OR r.price <= :maxPrice) AND " +
           "(cast(:roomType as string) IS NULL OR r.roomType = :roomType) AND " +
           "(cast(:city as string) IS NULL OR r.city = :city) AND " +
           "(cast(:district as string) IS NULL OR r.district = :district)")
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

