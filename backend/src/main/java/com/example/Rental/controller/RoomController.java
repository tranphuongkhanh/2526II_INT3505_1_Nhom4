package com.example.Rental.controller;

import com.example.Rental.dto.request.RoomFilterRequest;
import com.example.Rental.dto.request.RoomRequest;
import com.example.Rental.dto.request.RoomStatusUpdateRequest;
import com.example.Rental.dto.response.ApiResponse;
import com.example.Rental.dto.response.RoomResponse;
import com.example.Rental.entity.Room;
import com.example.Rental.entity.User;
import com.example.Rental.exception.EntityNotFoundException;
import com.example.Rental.exception.UnauthorizedException;
import com.example.Rental.repository.UserRepository;
import com.example.Rental.service.RoomService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;
    private final UserRepository userRepository;

    private Long getCurrentOwnerId(Principal principal) {
        if (principal == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập!");
        }
        User owner = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new EntityNotFoundException("User không tồn tại"));
        return owner.getId();
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<RoomResponse>>> getAllRooms(
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int limit,
            RoomFilterRequest filter,
            Principal principal) {

        Long ownerId = getCurrentOwnerId(principal);
        Page<RoomResponse> result = roomService.getAllRoomsByOwner(ownerId, filter, page, limit);

        ApiResponse<Page<RoomResponse>> response = new ApiResponse<>();
        response.setSuccess(true);
        response.setMessage("Lấy danh sách phòng trọ thành công");
        response.setData(result);

        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<RoomResponse> createRoom(@RequestBody RoomRequest request, Principal principal) {
        Long ownerId = getCurrentOwnerId(principal);
        Room createdRoom = roomService.createRoom(ownerId, request);
        RoomResponse createdRoomResponse = RoomService.fromEntity(createdRoom);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdRoomResponse);
    }

    @GetMapping("/{roomId}")
    public ResponseEntity<RoomResponse> getRoomDetail(@PathVariable Long roomId, Principal principal) {
        Long ownerId = getCurrentOwnerId(principal);
        return ResponseEntity.ok(roomService.getRoomDetail(roomId, ownerId));
    }

    @PutMapping("/{roomId}")
    public ResponseEntity<RoomResponse> updateRoom(@PathVariable Long roomId, @RequestBody RoomRequest request, Principal principal) {
        Long ownerId = getCurrentOwnerId(principal);
        RoomResponse updatedRoom = roomService.updateRoom(roomId, ownerId, request);
        return ResponseEntity.ok(updatedRoom);
    }

    @DeleteMapping("/{roomId}")
    public ResponseEntity<Void> deleteRoom(@PathVariable Long roomId, Principal principal) {
        Long ownerId = getCurrentOwnerId(principal);
        roomService.deleteRoom(roomId, ownerId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{roomId}/rental-status")
    public ResponseEntity<RoomResponse> updateRentalStatus(
            @PathVariable Long roomId,
            @RequestBody RoomStatusUpdateRequest request,
            Principal principal) {
        Long ownerId = getCurrentOwnerId(principal);
        RoomResponse updatedRoom = roomService.updateRentalStatus(roomId, ownerId, request.getStatus());
        return ResponseEntity.ok(updatedRoom);
    }
}