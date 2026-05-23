package com.example.Rental.service;

import com.example.Rental.entity.Room;
import com.example.Rental.entity.RoomImage;
import com.example.Rental.exception.EntityNotFoundException;
import com.example.Rental.repository.RoomImageRepository;
import com.example.Rental.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomImageService {
    private final RoomImageRepository roomImageRepository;
    private final RoomRepository roomRepository;
    private final CloudinaryService cloudinaryService;

    private Room validateRoomOwner(Long roomId, Long ownerId) {
        return roomRepository.findByIdAndOwnerIdAndDeletedAtIsNull(roomId, ownerId)
                .orElseThrow(() -> new AccessDeniedException("Phòng không tồn tại hoặc bạn không có quyền thao tác!"));
    }

    @Transactional
    public RoomImage uploadImage(Long roomId, Long ownerId, MultipartFile file) {
        Room room = validateRoomOwner(roomId, ownerId);

        String uploadedUrl = cloudinaryService.uploadImage(file);

        Integer currentMaxOrder = roomImageRepository.findMaxDisplayOrderByRoomId(roomId);
        int nextOrder = currentMaxOrder + 1;

        boolean isFirstImage = (nextOrder == 0);

        RoomImage roomImage = RoomImage.builder()
                .room(room)
                .imageUrl(uploadedUrl)
                .isThumbnail(isFirstImage)
                .displayOrder(nextOrder)
                .build();

        return roomImageRepository.save(roomImage);
    }

    @Transactional
    public void deleteImage(Long roomId, Long imageId, Long ownerId) {
        validateRoomOwner(roomId, ownerId);

        RoomImage image = roomImageRepository.findByIdAndRoomId(imageId, roomId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hình ảnh này!"));

        boolean wasThumbnail = image.getIsThumbnail();

        cloudinaryService.deleteImage(image.getImageUrl());

        roomImageRepository.delete(image);

        if (wasThumbnail) {
            // Lấy danh sách các ảnh còn lại của phòng (đã sắp xếp theo thứ tự hiển thị)
            List<RoomImage> remainingImages = roomImageRepository.findByRoomIdOrderByDisplayOrderAsc(roomId);

            // Nếu phòng vẫn còn ảnh khác, tiến hành set ảnh đầu tiên làm thumbnail mới
            if (!remainingImages.isEmpty()) {
                RoomImage newThumbnail = remainingImages.get(0);
                newThumbnail.setIsThumbnail(true);
                roomImageRepository.save(newThumbnail);
            }
        }
    }

    @Transactional
    public RoomImage setThumbnail(Long roomId, Long imageId, Long ownerId) {
        validateRoomOwner(roomId, ownerId);

        RoomImage targetImage = roomImageRepository.findByIdAndRoomId(imageId, roomId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hình ảnh này!"));

        roomImageRepository.resetThumbnailForRoom(roomId);

        targetImage.setIsThumbnail(true);
        return roomImageRepository.save(targetImage);
    }
}