package com.example.Rental.controller;

import com.example.Rental.dto.response.RoomImageResponse;
import com.example.Rental.entity.RoomImage;
import com.example.Rental.entity.User;
import com.example.Rental.exception.EntityNotFoundException;
import com.example.Rental.exception.UnauthorizedException;
import com.example.Rental.repository.UserRepository;
import com.example.Rental.service.RoomImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/rooms/{roomId}/images")
@RequiredArgsConstructor
public class RoomImageController {
    private final RoomImageService roomImageService;
    private final UserRepository userRepository;

    private Long getCurrentOwnerId(Principal principal) {
        if (principal == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập!");
        }
        User owner = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new EntityNotFoundException("User không tồn tại"));
        return owner.getId();
    }

    @PostMapping
    public ResponseEntity<RoomImageResponse> uploadRoomImage(
            @PathVariable Long roomId,
            @RequestParam("image") MultipartFile file,
            Principal principal) {

        Long ownerId = getCurrentOwnerId(principal);

        if (file.isEmpty()) {
            throw new RuntimeException("File ảnh không được để trống!");
        }

        RoomImage savedImage = roomImageService.uploadImage(roomId, ownerId, file);
        RoomImageResponse response = RoomImageResponse.builder()
                .id(savedImage.getId())
                .imageUrl(savedImage.getImageUrl())
                .thumbnail(savedImage.getIsThumbnail())
                .displayOrder(savedImage.getDisplayOrder())
                .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{imageId}")
    public ResponseEntity<Void> deleteRoomImage(
            @PathVariable Long roomId,
            @PathVariable Long imageId,
            Principal principal) {

        Long ownerId = getCurrentOwnerId(principal);
        roomImageService.deleteImage(roomId, imageId, ownerId);

        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{imageId}/thumbnail")
    public ResponseEntity<RoomImageResponse> setThumbnail(
            @PathVariable Long roomId,
            @PathVariable Long imageId,
            Principal principal) {

        Long ownerId = getCurrentOwnerId(principal);
        RoomImage updatedImage = roomImageService.setThumbnail(roomId, imageId, ownerId);

        RoomImageResponse response = RoomImageResponse.builder()
                .id(updatedImage.getId())
                .imageUrl(updatedImage.getImageUrl())
                .thumbnail(updatedImage.getIsThumbnail())
                .displayOrder(updatedImage.getDisplayOrder())
                .build();
        return ResponseEntity.ok(response);
    }
}