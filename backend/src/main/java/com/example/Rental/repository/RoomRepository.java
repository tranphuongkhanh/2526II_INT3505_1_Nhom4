package com.example.Rental.repository;

import com.example.Rental.entity.Room;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Long> {
    Page<Room> findByOwnerIdAndDeletedAtIsNull(Long ownerId, Pageable pageable);

    Optional<Room> findByIdAndDeletedAtIsNull(Long id);

    Optional<Room> findByIdAndOwnerIdAndDeletedAtIsNull(Long roomId, Long ownerId);

    long countByDeletedAtIsNull();
}
