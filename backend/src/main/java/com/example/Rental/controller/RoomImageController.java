package com.example.Rental.controller;

import com.example.Rental.entity.RoomImage;
import com.example.Rental.entity.User;
import com.example.Rental.repository.UserRepository;
import com.example.Rental.service.RoomImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/rooms/{roomId}/images")
@RequiredArgsConstructor
public class RoomImageController {
    private final RoomImageService roomImageService;
    private final UserRepository userRepository;

    private Long getCurrentOwnerId(Principal principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập!");
        }
        User owner = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User không tồn tại"));
        return owner.getId();
    }

    @PostMapping
    public ResponseEntity<RoomImage> uploadRoomImage(
            @PathVariable Long roomId,
            @RequestParam("image") MultipartFile file, // Nhận file từ form-data với key là 'image'
            Principal principal) {

        Long ownerId = getCurrentOwnerId(principal);

        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File ảnh không được để trống!");
        }

        RoomImage savedImage = roomImageService.uploadImage(roomId, ownerId, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedImage);
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
    public ResponseEntity<RoomImage> setThumbnail(
            @PathVariable Long roomId,
            @PathVariable Long imageId,
            Principal principal) {

        Long ownerId = getCurrentOwnerId(principal);
        RoomImage updatedImage = roomImageService.setThumbnail(roomId, imageId, ownerId);

        return ResponseEntity.ok(updatedImage);
    }
}