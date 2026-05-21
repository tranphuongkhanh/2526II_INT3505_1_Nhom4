package com.example.Rental.repository;

import com.example.Rental.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoomRepository extends JpaRepository<Room, Long> {
    List<Room> findByOwnerIdAndDeletedAtIsNull(Long ownerId);
}
