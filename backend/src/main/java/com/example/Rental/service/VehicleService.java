package com.example.Rental.service;

import com.example.Rental.entity.Room;
import com.example.Rental.entity.User;
import com.example.Rental.entity.Vehicle;
import com.example.Rental.repository.RoomRepository;
import com.example.Rental.repository.UserRepository;
import com.example.Rental.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;

    public VehicleService(VehicleRepository vehicleRepository, RoomRepository roomRepository, UserRepository userRepository) {
        this.vehicleRepository = vehicleRepository;
        this.roomRepository = roomRepository;
        this.userRepository = userRepository;
    }

    public List<Vehicle> listByRoom(Long roomId) {
        return vehicleRepository.findByRoomId(roomId);
    }

    @Transactional
    public Vehicle register(Long roomId, Vehicle vehicle, Long renterId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Room not found"));
        vehicle.setRoom(room);
        if (renterId != null) {
            User renter = userRepository.findById(renterId)
                    .orElseThrow(() -> new IllegalArgumentException("Renter not found"));
            vehicle.setRenter(renter);
        }
        return vehicleRepository.save(vehicle);
    }

    @Transactional
    public void delete(Long vehicleId) {
        vehicleRepository.deleteById(vehicleId);
    }
}
