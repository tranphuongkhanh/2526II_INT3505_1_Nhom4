package com.example.Rental.repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

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
    Page<Post> findByCreatedByIdAndStatusNot(Long userId, PostStatus status, Pageable pageable);
    List<Post> findByStatusOrderByCreatedAtDesc(PostStatus status);

    @Query("SELECT p FROM Post p JOIN FETCH p.room r WHERE p.status = 'APPROVED' AND p.endDate > CURRENT_TIMESTAMP")
    List<Post> findAllActivePosts();

    long countByStatus(PostStatus status);

    // 1. API Tìm kiếm cho Guest — chỉ JOIN FETCH các quan hệ *-to-one để giữ pagination ở DB.
    //    Ảnh được nạp lazily theo batch (xem @BatchSize trên Room.images) để tránh N+1.
    @Query(value = "SELECT p FROM Post p JOIN FETCH p.room r WHERE " +
           "p.status = 'APPROVED' AND p.endDate > CURRENT_TIMESTAMP AND " +
           "(cast(:keyword as string) IS NULL OR LOWER(r.title) LIKE LOWER(CONCAT('%', cast(:keyword as string), '%')) OR LOWER(r.address) LIKE LOWER(CONCAT('%', cast(:keyword as string), '%'))) AND " +
           "(cast(:minPrice as string) IS NULL OR r.price >= :minPrice) AND " +
           "(cast(:maxPrice as string) IS NULL OR r.price <= :maxPrice) AND " +
           "(:hasRoomTypes = false OR r.roomType IN :roomTypes) AND " +
           "(cast(:city as string) IS NULL OR r.city = :city) AND " +
           "(cast(:district as string) IS NULL OR r.district = :district) AND " +
           "(cast(:maxElectricityPrice as string) IS NULL OR r.electricityPricePerUnit <= :maxElectricityPrice) AND " +
           "(cast(:maxWaterPrice as string) IS NULL OR r.waterPricePerUnit <= :maxWaterPrice) AND " +
           "(cast(:maxServiceFee as string) IS NULL OR r.serviceFee <= :maxServiceFee) AND " +
           "(cast(:maxWifiFee as string) IS NULL OR r.wifiFee <= :maxWifiFee)",
           countQuery = "SELECT COUNT(p) FROM Post p JOIN p.room r WHERE " +
           "p.status = 'APPROVED' AND p.endDate > CURRENT_TIMESTAMP AND " +
           "(cast(:keyword as string) IS NULL OR LOWER(r.title) LIKE LOWER(CONCAT('%', cast(:keyword as string), '%')) OR LOWER(r.address) LIKE LOWER(CONCAT('%', cast(:keyword as string), '%'))) AND " +
           "(cast(:minPrice as string) IS NULL OR r.price >= :minPrice) AND " +
           "(cast(:maxPrice as string) IS NULL OR r.price <= :maxPrice) AND " +
           "(:hasRoomTypes = false OR r.roomType IN :roomTypes) AND " +
           "(cast(:city as string) IS NULL OR r.city = :city) AND " +
           "(cast(:district as string) IS NULL OR r.district = :district) AND " +
           "(cast(:maxElectricityPrice as string) IS NULL OR r.electricityPricePerUnit <= :maxElectricityPrice) AND " +
           "(cast(:maxWaterPrice as string) IS NULL OR r.waterPricePerUnit <= :maxWaterPrice) AND " +
           "(cast(:maxServiceFee as string) IS NULL OR r.serviceFee <= :maxServiceFee) AND " +
           "(cast(:maxWifiFee as string) IS NULL OR r.wifiFee <= :maxWifiFee)")
    Page<Post> searchGuestPosts(@Param("keyword") String keyword,
                                @Param("minPrice") BigDecimal minPrice,
                                @Param("maxPrice") BigDecimal maxPrice,
                                @Param("hasRoomTypes") boolean hasRoomTypes,
                                @Param("roomTypes") List<RoomType> roomTypes,
                                @Param("city") String city,
                                @Param("district") String district,
                                @Param("maxElectricityPrice") BigDecimal maxElectricityPrice,
                                @Param("maxWaterPrice") BigDecimal maxWaterPrice,
                                @Param("maxServiceFee") BigDecimal maxServiceFee,
                                @Param("maxWifiFee") BigDecimal maxWifiFee,
                                Pageable pageable);

    // 2b. Lấy chi tiết bài đăng kèm room, images, owner trong 1 query
    @Query("SELECT p FROM Post p JOIN FETCH p.room r LEFT JOIN FETCH r.images LEFT JOIN FETCH p.createdBy WHERE p.id = :postId")
    Optional<Post> findByIdWithDetails(@Param("postId") Long postId);

    // 2. Cập nhật view_count trực tiếp dưới DB để tránh lỗi đồng bộ
    @Modifying
    @Query("UPDATE Post p SET p.viewCount = p.viewCount + 1 WHERE p.id = :postId")
    void incrementViewCount(@Param("postId") Long postId);

    Page<Post> findByStatus(PostStatus status, Pageable pageable);

    List<Post> findByStatusAndEndDateBetween(PostStatus status, java.time.LocalDateTime start, java.time.LocalDateTime end);
}

