package com.example.Rental.repository;

import com.example.Rental.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Long> {
    List<Room> findByOwnerIdAndDeletedAtIsNull(Long ownerId);

    Optional<Room> findByIdAndDeletedAtIsNull(Long id);

    Optional<Room> findByIdAndOwnerIdAndDeletedAtIsNull(Long roomId, Long ownerId);

    long countByDeletedAtIsNull();
}
