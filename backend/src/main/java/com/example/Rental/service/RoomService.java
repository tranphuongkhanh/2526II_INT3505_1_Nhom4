package com.example.Rental.service;

import com.example.Rental.dto.request.RoomRequest;
import com.example.Rental.dto.response.RoomResponse;
import com.example.Rental.entity.Room;
import com.example.Rental.entity.User;
import com.example.Rental.enums.RentalStatus;
import com.example.Rental.exception.EntityNotFoundException;
import com.example.Rental.repository.RoomRepository;
import com.example.Rental.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.lang.NonNull;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final UserRepository userRepository;

    public static RoomResponse fromEntity(Room room) {
        if (room == null)
            return null;

        return RoomResponse.builder()
                .id(room.getId())
                .ownerId(room.getOwner() != null ? room.getOwner().getId() : null)
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
                .rentalStatus(room.getRentalStatus())
                .avgRating(room.getAvgRating())
                .reviewCount(room.getReviewCount())
                .createdAt(room.getCreatedAt())
                .updatedAt(room.getUpdatedAt())
                .build();
    }

    public Page<RoomResponse> getAllRoomsByOwner(Long ownerId, int page, int size) {
        // Chuyển trang từ 1-index sang 0-index, mặc định sắp xếp phòng mới nhất lên đầu
        int pageNumber = page - 1;

        Pageable pageable = PageRequest.of(pageNumber, size, Sort.by("createdAt").descending());

        Page<Room> rooms = roomRepository.findByOwnerIdAndDeletedAtIsNull(ownerId, pageable);

        return rooms.map(RoomService::fromEntity);
    }

    @Transactional
    public Room createRoom(Long ownerId, RoomRequest request) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new EntityNotFoundException("Owner not found"));

        Room room = Room.builder()
                .owner(owner)
                .title(request.getTitle())
                .description(request.getDescription())
                .price(request.getPrice())
                .areaMq(request.getAreaMq())
                .roomType(request.getRoomType())
                .address(request.getAddress())
                .ward(request.getWard())
                .district(request.getDistrict())
                .city(request.getCity())
                .hasWifi(request.getHasWifi())
                .hasAc(request.getHasAc())
                .hasFridge(request.getHasFridge())
                .hasParking(request.getHasParking())
                .hasPrivateWc(request.getHasPrivateWc())
                .hasSecurity(request.getHasSecurity())
                .rentalStatus(RentalStatus.AVAILABLE)
                .avgRating(0.0)
                .reviewCount(0)
                .build();

        return roomRepository.save(room);
    }

    private Room getRoomEntity(Long roomId, Long ownerId) {
        Room room = roomRepository.findByIdAndDeletedAtIsNull(roomId)
                .orElseThrow(() -> new EntityNotFoundException("Phòng không tồn tại hoặc đã bị xóa"));

        if (!room.getOwner().getId().equals(ownerId)) {
            throw new AccessDeniedException("Bạn không có quyền chỉnh sửa/xóa phòng của người khác");
        }

        return room;
    }

    public RoomResponse getRoomDetail(Long roomId, Long ownerId) {
        Room room = getRoomEntity(roomId, ownerId);
        return fromEntity(room);
    }

    @Transactional
    public RoomResponse updateRoom(Long roomId, Long ownerId, RoomRequest request) {
        Room room = getRoomEntity(roomId, ownerId);

        room.setTitle(request.getTitle());
        room.setDescription(request.getDescription());
        room.setPrice(request.getPrice());
        room.setAreaMq(request.getAreaMq());
        room.setRoomType(request.getRoomType());
        room.setAddress(request.getAddress());
        room.setWard(request.getWard());
        room.setDistrict(request.getDistrict());
        room.setCity(request.getCity());
        room.setHasWifi(request.getHasWifi());
        room.setHasAc(request.getHasAc());
        room.setHasFridge(request.getHasFridge());
        room.setHasParking(request.getHasParking());
        room.setHasPrivateWc(request.getHasPrivateWc());
        room.setHasSecurity(request.getHasSecurity());

        Room updatedRoom = roomRepository.save(room);
        return fromEntity(updatedRoom);
    }

    @Transactional
    public void deleteRoom(Long roomId, Long ownerId) {
        Room room = getRoomEntity(roomId, ownerId);
        room.setDeletedAt(LocalDateTime.now());
        roomRepository.save(room);
    }

    @Transactional
    public RoomResponse updateRentalStatus(Long roomId, Long ownerId, RentalStatus status) {
        Room room = getRoomEntity(roomId, ownerId);
        room.setRentalStatus(status);

        Room updatedRoom = roomRepository.save(room);
        return fromEntity(updatedRoom); // Trả về DTO
    }
}