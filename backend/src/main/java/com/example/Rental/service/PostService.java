package com.example.Rental.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.Rental.dto.request.CreatePostRequest;
import com.example.Rental.dto.request.ExtendPostRequest;
import com.example.Rental.dto.request.PostSearchRequest;
import com.example.Rental.dto.request.PostStatusUpdateRequest;
import com.example.Rental.dto.response.AdminPostResponse;
import com.example.Rental.dto.response.OwnerPostResponse;
import com.example.Rental.dto.response.PostDetailResponse;
import com.example.Rental.dto.response.PostSummaryResponse;
import com.example.Rental.entity.Payment;
import com.example.Rental.entity.Post;
import com.example.Rental.entity.PostExtension;
import com.example.Rental.entity.PostView;
import com.example.Rental.entity.Room;
import com.example.Rental.entity.RoomImage;
import com.example.Rental.entity.User;
import com.example.Rental.enums.PaymentStatus;
import com.example.Rental.enums.PostStatus;
import com.example.Rental.exception.EntityNotFoundException;
import com.example.Rental.repository.FavoriteRepository;
import com.example.Rental.repository.PaymentRepository;
import com.example.Rental.repository.PostExtensionRepository;
import com.example.Rental.repository.PostRepository;
import com.example.Rental.repository.PostViewRepository;
import com.example.Rental.repository.RoomRepository;
import com.example.Rental.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final PostViewRepository postViewRepository;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final PaymentRepository paymentRepository;
    private final PostExtensionRepository postExtensionRepository;
    private final FavoriteRepository favoriteRepository;

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
                request.getMaxElectricityPrice(),
                request.getMaxWaterPrice(),
                request.getMaxServiceFee(),
                request.getMaxWifiFee(),
                pageable
        );

        return posts.map(this::mapToSummaryResponse);
    }

    @Transactional(readOnly = true)
    public PostDetailResponse getPostDetail(Long postId, String viewerEmail) {
        Post post = postRepository.findByIdWithDetails(postId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bài đăng ID: " + postId));

        // Cộng 1 view cho logic hiển thị realtime (việc ghi DB chạy async ở recordPostView)
        post.setViewCount((post.getViewCount() == null ? 0 : post.getViewCount()) + 1);

        Boolean isFavorited = null;
        if (viewerEmail != null) {
            isFavorited = userRepository.findByEmail(viewerEmail)
                    .map(u -> favoriteRepository.existsByUserIdAndPostId(u.getId(), postId))
                    .orElse(false);
        }

        return mapToDetailResponse(post, isFavorited);
    }

    @Async
    @Transactional
    public void recordPostView(Long postId) {
        try {
            postRepository.incrementViewCount(postId);

            Post postRef = postRepository.getReferenceById(postId);
            PostView viewLog = PostView.builder()
                    .post(postRef)
                    .viewedAt(LocalDateTime.now())
                    .build();
            postViewRepository.save(viewLog);
        } catch (Exception ignored) {
            // Không chặn user nếu tracking lỗi
        }
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

    private PostDetailResponse mapToDetailResponse(Post post, Boolean isFavorited) {
        Room room = post.getRoom();
        User owner = post.getCreatedBy();

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
                .hasAc(room.getHasAc())
                .hasFridge(room.getHasFridge())
                .hasPrivateWc(room.getHasPrivateWc())
                .hasSecurity(room.getHasSecurity())
                .wifiFee(room.getWifiFee())
                .waterPricePerUnit(room.getWaterPricePerUnit())
                .electricityPricePerUnit(room.getElectricityPricePerUnit())
                .serviceFee(room.getServiceFee())
                .bikeParkingFee(room.getBikeParkingFee())
                .deposit(room.getDeposit())
                .imageUrls(images)
                .ownerId(owner != null ? owner.getId() : null)
                .ownerName(owner != null ? owner.getFullName() : null)
                .ownerPhone(owner != null ? owner.getPhone() : null)
                .ownerAvatar(owner != null ? owner.getAvatarUrl() : null)
                .isFavorited(isFavorited)
                .build();
    }

    @Transactional(readOnly = true)
    public Page<OwnerPostResponse> getMyPosts(String email, Integer page, Integer size) {
        int pageNumber = (page != null && page > 0) ? page - 1 : 0;
        int pageSize = (size != null && size > 0) ? size : 10;
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by("createdAt").descending());

        // 1. Tìm User bằng email
        User owner = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy user với email: " + email));

        // 2. Lấy danh sách bài đăng của user này
        Page<Post> posts = postRepository.findByCreatedByIdAndStatusNot(owner.getId(), PostStatus.DELETED, pageable);

        // 3. Map sang DTO
        return posts.map(post -> {
            Room room = post.getRoom();
            String thumbnailUrl = room.getImages() == null ? null : room.getImages().stream()
                    .filter(img -> Boolean.TRUE.equals(img.getIsThumbnail()))
                    .map(RoomImage::getImageUrl)
                    .findFirst()
                    .orElse(room.getImages().stream()
                            .map(RoomImage::getImageUrl)
                            .findFirst()
                            .orElse(null));
            String address = java.util.stream.Stream.of(
                    room.getAddress(), room.getDistrict(), room.getCity())
                    .filter(s -> s != null && !s.isBlank())
                    .collect(java.util.stream.Collectors.joining(", "));
            return OwnerPostResponse.builder()
                    .id(post.getId())
                    .roomTitle(room.getTitle())
                    .status(post.getStatus())
                    .rejectReason(post.getRejectReason())
                    .listingFee(post.getListingFee())
                    .startDate(post.getStartDate())
                    .endDate(post.getEndDate())
                    .viewCount(post.getViewCount())
                    .favoriteCount(post.getFavoriteCount())
                    .createdAt(post.getCreatedAt())
                    .thumbnailUrl(thumbnailUrl)
                    .price(room.getPrice())
                    .address(address.isBlank() ? null : address)
                    .build();
        });
    }

    @Transactional
    public Payment createPost(String email, CreatePostRequest request) {
        User owner = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy phòng"));

        // Kiểm tra quyền sở hữu phòng
        if (!room.getOwner().getId().equals(owner.getId())) {
            throw new AccessDeniedException("Bạn không phải chủ của phòng này");
        }

        // 1. Tính toán phí (TẠM THỜI GIẢ LẬP)
        BigDecimal fee = calculateFee(request.getDurationType(), request.getDurationValue());

        // 2. Tạo Post mới (Trạng thái PENDING, chưa có ngày bắt đầu/kết thúc)
        Post newPost = Post.builder()
                .room(room)
                .createdBy(owner)
                .durationType(request.getDurationType())
                .durationValue(request.getDurationValue())
                .listingFee(fee)
                .status(PostStatus.PENDING)
                .build();
        postRepository.save(newPost);

        // 3. Tạo hóa đơn Payment
        Payment payment = Payment.builder()
                .owner(owner)
                .post(newPost)
                .amount(fee)
                .status(PaymentStatus.PENDING)
                .note("Thanh toán tạo bài đăng mới cho phòng: " + room.getTitle())
                .build();
        return paymentRepository.save(payment);
    }

    @Transactional
    public Payment extendPost(String email, Long postId, ExtendPostRequest request) {
        User owner = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bài đăng"));

        if (post.getStatus() != PostStatus.APPROVED) {
            throw new IllegalStateException("Chỉ được gia hạn bài đăng đã được duyệt (APPROVED)");
        }

        // Kiểm tra quyền sở hữu bài đăng
        if (!post.getCreatedBy().getId().equals(owner.getId())) {
            throw new AccessDeniedException("Bạn không có quyền gia hạn bài đăng này");
        }

        // 1. Tính toán phí gia hạn
        BigDecimal fee = calculateFee(request.getDurationType(), request.getDurationValue());

        // 2. Tính toán ngày hết hạn mới (Dựa trên ngày hết hạn cũ hoặc ngày hiện tại nếu đã quá hạn)
        LocalDateTime prevEndDate = post.getEndDate() != null ? post.getEndDate() : LocalDateTime.now();
        if (prevEndDate.isBefore(LocalDateTime.now())) {
            prevEndDate = LocalDateTime.now();
        }
        LocalDateTime newEndDate = calculateNewEndDate(prevEndDate, request.getDurationType(), request.getDurationValue());

        // 3. Lưu lịch sử gia hạn vào bảng PostExtension
        PostExtension extension = PostExtension.builder()
                .post(post)
                .durationType(request.getDurationType())
                .durationValue(request.getDurationValue())
                .feePaid(fee)
                .prevEndDate(prevEndDate)
                .newEndDate(newEndDate)
                .build();
        postExtensionRepository.save(extension);

        // Chú ý: Ở bước này ta chưa cập nhật newEndDate trực tiếp vào Post. 
        // Phải đợi Admin duyệt (hoặc đợi Payment chuyển thành PAID) thì mới cập nhật.

        // 4. Tạo hóa đơn Payment
        Payment payment = Payment.builder()
                .owner(owner)
                .post(post)
                .extension(extension)
                .amount(fee)
                .status(PaymentStatus.PENDING)
                .note("Thanh toán gia hạn bài đăng ID: " + post.getId())
                .build();
        return paymentRepository.save(payment);
    }

    // --- Helper Methods ---

    private BigDecimal calculateFee(com.example.Rental.enums.DurationType type, Integer value) {
        // TODO: Nếu cần thay đổi công thức
        // Hiện tại: 1 Ngày = 10,000đ, 1 Tuần = 50,000đ, 1 Tháng = 200,000đ

        long unitPrice = 0;
        switch (type) {
            case DAY:
                unitPrice = 10000;
                break;
            case WEEK:
                unitPrice = 50000;
                break;
            case MONTH:
                unitPrice = 200000;
                break;
        }
        return BigDecimal.valueOf(unitPrice * value);
    }

    private LocalDateTime calculateNewEndDate(LocalDateTime fromDate, com.example.Rental.enums.DurationType type, Integer value) {
        switch (type) {
            case DAY:
                return fromDate.plusDays(value);
            case WEEK:
                return fromDate.plusWeeks(value);
            case MONTH:
                return fromDate.plusMonths(value);
            default:
                return fromDate;
        }
    }

    @Transactional
    public void deletePost(String email, Long postId) {
        // 1. Tìm User
        User owner = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        // 2. Tìm bài đăng
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bài đăng ID: " + postId));

        // 3. Kiểm tra quyền sở hữu (Chỉ chủ bài mới được quyền xóa)
        if (!post.getCreatedBy().getId().equals(owner.getId())) {
            throw new AccessDeniedException("Bạn không có quyền xóa bài đăng này");
        }

        // 4. Thực hiện xóa mềm (Đổi trạng thái)
        post.setStatus(PostStatus.DELETED);
        
        // Cập nhật ngày kết thúc về hiện tại để bài viết lập tức hết hạn
        post.setEndDate(LocalDateTime.now());
        
        postRepository.save(post);
    }

    // --- API DÀNH CHO ADMIN ---

    @Transactional(readOnly = true)
    public Page<AdminPostResponse> getAdminPosts(String statusStr, Integer page, Integer size) {
        // Chuyển page 1-index (từ Client) sang 0-index (của Spring)
        int pageNumber = (page != null && page > 0) ? page - 1 : 0;
        int pageSize = (size != null && size > 0) ? size : 20;
        
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by("createdAt").descending());
        Page<Post> posts;

        if (statusStr != null && !statusStr.isEmpty()) {
            PostStatus status = PostStatus.valueOf(statusStr.toUpperCase());
            posts = postRepository.findByStatus(status, pageable);
        } else {
            posts = postRepository.findAll(pageable);
        }

        return posts.map(this::mapToAdminPostResponse);
    }

    @Transactional
    public AdminPostResponse updatePostStatus(Long postId, PostStatusUpdateRequest request, String adminEmail) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bài đăng ID: " + postId));
                
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Admin"));

        // Cập nhật thông tin người duyệt
        post.setStatus(request.getStatus());
        post.setApprovedBy(admin);
        post.setApprovedAt(LocalDateTime.now());

        if (request.getStatus() == PostStatus.APPROVED) {
            // Check payment status before setting start/endDate
            Payment payment = paymentRepository.findByPostIdAndExtensionIsNull(post.getId()).orElse(null);
            if (payment != null && payment.getStatus() == com.example.Rental.enums.PaymentStatus.PAID) {
                post.setStartDate(LocalDateTime.now());
                post.setEndDate(calculateNewEndDate(LocalDateTime.now(), post.getDurationType(), post.getDurationValue()));
            }
            post.setRejectReason(null); // Xóa lý do từ chối cũ (nếu có)
            
        } else if (request.getStatus() == PostStatus.REJECTED) {
            // Khi từ chối: Bắt buộc phải có lý do
            if (request.getRejectReason() == null || request.getRejectReason().trim().isEmpty()) {
                throw new IllegalArgumentException("Vui lòng nhập lý do từ chối bài đăng!");
            }
            post.setRejectReason(request.getRejectReason());
        }

        postRepository.save(post);
        return mapToAdminPostResponse(post);
    }

    // --- Helper Method ---
    private AdminPostResponse mapToAdminPostResponse(Post post) {
        Room room = post.getRoom();
        return AdminPostResponse.builder()
                .id(post.getId())
                .roomTitle(room.getTitle())
                .ownerName(post.getCreatedBy().getFullName())
                .ownerEmail(post.getCreatedBy().getEmail())
                .status(post.getStatus())
                .createdAt(post.getCreatedAt())
                .startDate(post.getStartDate())
                .endDate(post.getEndDate())
                .rejectReason(post.getRejectReason())
                .approvedByEmail(post.getApprovedBy() != null ? post.getApprovedBy().getEmail() : null)
                .approvedAt(post.getApprovedAt())
                // Room details
                .price(room.getPrice())
                .deposit(room.getDeposit())
                .areaMq(room.getAreaMq())
                .roomType(room.getRoomType())
                .description(room.getDescription())
                .address(room.getAddress())
                .ward(room.getWard())
                .district(room.getDistrict())
                .city(room.getCity())
                .hasAc(room.getHasAc())
                .hasFridge(room.getHasFridge())
                .hasPrivateWc(room.getHasPrivateWc())
                .hasSecurity(room.getHasSecurity())
                .wifiFee(room.getWifiFee())
                .electricityPricePerUnit(room.getElectricityPricePerUnit())
                .waterPricePerUnit(room.getWaterPricePerUnit())
                .serviceFee(room.getServiceFee())
                .bikeParkingFee(room.getBikeParkingFee())
                .images(room.getImages() != null
                        ? room.getImages().stream()
                                .sorted(java.util.Comparator.comparingInt(img -> img.getDisplayOrder() != null ? img.getDisplayOrder() : 0))
                                .map(img -> com.example.Rental.dto.response.RoomImageResponse.builder()
                                        .id(img.getId())
                                        .imageUrl(img.getImageUrl())
                                        .thumbnail(img.getIsThumbnail())
                                        .displayOrder(img.getDisplayOrder())
                                        .build())
                                .collect(java.util.stream.Collectors.toList())
                        : java.util.Collections.emptyList())
                .build();
    }
}