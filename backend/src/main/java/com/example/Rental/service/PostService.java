package com.example.Rental.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.Rental.dto.request.CreatePostRequest;
import com.example.Rental.dto.request.ExtendPostRequest;
import com.example.Rental.dto.request.PostSearchRequest;
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
}