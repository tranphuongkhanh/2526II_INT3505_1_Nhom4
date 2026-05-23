package com.example.Rental.controller;

import com.example.Rental.dto.request.RoomRequest;
import com.example.Rental.dto.request.RoomStatusUpdateRequest;
import com.example.Rental.dto.response.RoomResponse;
import com.example.Rental.entity.Room;
import com.example.Rental.service.RoomService;
import com.example.Rental.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.List;

@RestController
@RequestMapping("/api/v1/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;
    private final JwtUtil jwtUtil;

    private Long getCurrentOwnerId() {
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);

            Long userId = jwtUtil.extractUserId(token);

            if (userId != null) {
                return userId;
            }
        }

        throw new RuntimeException("Bạn chưa đăng nhập hoặc token không hợp lệ!");
    }

    @GetMapping
    public ResponseEntity<List<RoomResponse>> getAllRooms() {
        Long ownerId = getCurrentOwnerId();
        return ResponseEntity.ok(roomService.getAllRoomsByOwner(ownerId));
    }

    @PostMapping
    public ResponseEntity<RoomResponse> createRoom(@RequestBody RoomRequest request) {
        Long ownerId = getCurrentOwnerId();
        Room createdRoom = roomService.createRoom(ownerId, request);
        RoomResponse createdRoomResponse = RoomService.fromEntity(createdRoom);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdRoomResponse);
    }

    @GetMapping("/{roomId}")
    public ResponseEntity<RoomResponse> getRoomDetail(@PathVariable Long roomId) {
        Long ownerId = getCurrentOwnerId();
        return ResponseEntity.ok(roomService.getRoomDetail(roomId, ownerId));
    }

    @PutMapping("/{roomId}")
    public ResponseEntity<RoomResponse> updateRoom(@PathVariable Long roomId, @RequestBody RoomRequest request) {
        Long ownerId = getCurrentOwnerId();
        RoomResponse updatedRoom = roomService.updateRoom(roomId, ownerId, request);
        return ResponseEntity.ok(updatedRoom);
    }

    @DeleteMapping("/{roomId}")
    public ResponseEntity<Void> deleteRoom(@PathVariable Long roomId) {
        Long ownerId = getCurrentOwnerId();
        roomService.deleteRoom(roomId, ownerId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{roomId}/rental-status")
    public ResponseEntity<RoomResponse> updateRentalStatus(
            @PathVariable Long roomId,
            @RequestBody RoomStatusUpdateRequest request) {
        Long ownerId = getCurrentOwnerId();
        RoomResponse updatedRoom = roomService.updateRentalStatus(roomId, ownerId, request.getStatus());
        return ResponseEntity.ok(updatedRoom);
    }
}