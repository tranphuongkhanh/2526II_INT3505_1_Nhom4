package com.example.Rental.repository;

import com.example.Rental.entity.RoomImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RoomImageRepository extends JpaRepository<RoomImage, Long> {
    List<RoomImage> findByRoomIdOrderByDisplayOrderAsc(Long roomId);

    Optional<RoomImage> findByIdAndRoomId(Long id, Long roomId);

    // Xoá cờ thumbnail của tất cả ảnh trong một phòng (để set lại ảnh mới)
    @Modifying
    @Query("UPDATE RoomImage ri SET ri.isThumbnail = false WHERE ri.room.id = :roomId")
    void resetThumbnailForRoom(@Param("roomId") Long roomId);

    // Dùng COALESCE để nếu phòng chưa có ảnh nào (MAX trả về NULL), nó sẽ tự biến thành -1
    @Query("SELECT COALESCE(MAX(ri.displayOrder), -1) FROM RoomImage ri WHERE ri.room.id = :roomId")
    Integer findMaxDisplayOrderByRoomId(@Param("roomId") Long roomId);
}
