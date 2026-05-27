package com.example.Rental.service;

import com.example.Rental.dto.request.RoomFilterRequest;
import com.example.Rental.dto.request.RoomRequest;
import com.example.Rental.dto.response.RoomImageResponse;
import com.example.Rental.dto.response.RoomResponse;
import com.example.Rental.entity.Room;
import com.example.Rental.entity.User;
import com.example.Rental.enums.RentalStatus;
import com.example.Rental.exception.EntityNotFoundException;
import com.example.Rental.repository.RoomRepository;
import com.example.Rental.repository.RoomSpecification;
import com.example.Rental.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Comparator;
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
                .rentalStatus(room.getRentalStatus())
                .avgRating(room.getAvgRating())
                .reviewCount(room.getReviewCount())
                .createdAt(room.getCreatedAt())
                .updatedAt(room.getUpdatedAt())
                .images(room.getImages() != null
                    ? room.getImages().stream()
                        .sorted(Comparator.comparingInt(img -> img.getDisplayOrder() != null ? img.getDisplayOrder() : 0))
                        .map(img -> RoomImageResponse.builder()
                            .id(img.getId())
                            .imageUrl(img.getImageUrl())
                            .thumbnail(img.getIsThumbnail())
                            .displayOrder(img.getDisplayOrder())
                            .build())
                        .collect(Collectors.toList())
                    : Collections.emptyList())
                .build();
    }

    @Transactional(readOnly = true)
    public Page<RoomResponse> getAllRoomsByOwner(Long ownerId, RoomFilterRequest filter, int page, int size) {
        // Chuyển trang từ 1-index sang 0-index, mặc định sắp xếp phòng mới nhất lên đầu
        int pageNumber = page - 1;

        Pageable pageable = PageRequest.of(pageNumber, size, Sort.by("createdAt").descending());

        // Truyền filter object vào Specification
        Specification<Room> spec = RoomSpecification.filterRooms(ownerId, filter);

        // Gọi hàm findAll(Specification, Pageable) được cung cấp bởi JpaSpecificationExecutor
        Page<Room> rooms = roomRepository.findAll(spec, pageable);

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
                .price(request.getPrice() != null ? request.getPrice() : BigDecimal.ZERO)
                .areaMq(request.getAreaMq() != null ? request.getAreaMq() : 0.0)
                .roomType(request.getRoomType())
                .address(request.getAddress())
                .ward(request.getWard())
                .district(request.getDistrict())
                .city(request.getCity())
                .hasAc(request.getHasAc())
                .hasFridge(request.getHasFridge())
                .hasPrivateWc(request.getHasPrivateWc())
                .hasSecurity(request.getHasSecurity())
                .wifiFee(request.getWifiFee() != null ? request.getWifiFee() : BigDecimal.ZERO)
                .waterPricePerUnit(request.getWaterPricePerUnit() != null ? request.getWaterPricePerUnit() : BigDecimal.ZERO)
                .electricityPricePerUnit(request.getElectricityPricePerUnit() != null ? request.getElectricityPricePerUnit() : BigDecimal.ZERO)
                .serviceFee(request.getServiceFee() != null ? request.getServiceFee() : BigDecimal.ZERO)
                .bikeParkingFee(request.getBikeParkingFee() != null ? request.getBikeParkingFee() : BigDecimal.ZERO)
                .deposit(request.getDeposit() != null ? request.getDeposit() : BigDecimal.ZERO)
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

    @Transactional(readOnly = true)
    public RoomResponse getRoomDetail(Long roomId, Long ownerId) {
        Room room = getRoomEntity(roomId, ownerId);
        return fromEntity(room);
    }

    @Transactional
    public RoomResponse updateRoom(Long roomId, Long ownerId, RoomRequest request) {
        Room room = getRoomEntity(roomId, ownerId);

        room.setTitle(request.getTitle());
        room.setDescription(request.getDescription());
        room.setPrice(request.getPrice() != null ? request.getPrice() : BigDecimal.ZERO);
        room.setAreaMq(request.getAreaMq() != null ? request.getAreaMq() : 0.0);
        room.setRoomType(request.getRoomType());
        room.setAddress(request.getAddress());
        room.setWard(request.getWard());
        room.setDistrict(request.getDistrict());
        room.setCity(request.getCity());
        room.setHasAc(request.getHasAc());
        room.setHasFridge(request.getHasFridge());
        room.setHasPrivateWc(request.getHasPrivateWc());
        room.setHasSecurity(request.getHasSecurity());
        room.setWifiFee(request.getWifiFee() != null ? request.getWifiFee() : BigDecimal.ZERO);
        room.setWaterPricePerUnit(request.getWaterPricePerUnit() != null ? request.getWaterPricePerUnit() : BigDecimal.ZERO);
        room.setElectricityPricePerUnit(request.getElectricityPricePerUnit() != null ? request.getElectricityPricePerUnit() : BigDecimal.ZERO);
        room.setServiceFee(request.getServiceFee() != null ? request.getServiceFee() : BigDecimal.ZERO);
        room.setBikeParkingFee(request.getBikeParkingFee() != null ? request.getBikeParkingFee() : BigDecimal.ZERO);
        room.setDeposit(request.getDeposit() != null ? request.getDeposit() : BigDecimal.ZERO);

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