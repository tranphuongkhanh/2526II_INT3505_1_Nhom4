package com.example.Rental.controller;

import com.example.Rental.dto.request.VehicleRequest;
import com.example.Rental.dto.response.ApiResponse;
import com.example.Rental.dto.response.VehicleResponse;
import com.example.Rental.entity.Vehicle;
import com.example.Rental.service.VehicleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class VehicleController {

    private final VehicleService vehicleService;

    public VehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @GetMapping("/rooms/{roomId}/vehicles")
    public ResponseEntity<ApiResponse<List<VehicleResponse>>> listByRoom(@PathVariable Long roomId) {
        List<Vehicle> list = vehicleService.listByRoom(roomId);
        List<VehicleResponse> resp = list.stream().map(v -> VehicleResponse.builder()
                .id(v.getId())
                .roomId(v.getRoom() != null ? v.getRoom().getId() : null)
                .renterId(v.getRenter() != null ? v.getRenter().getId() : null)
                .licensePlate(v.getLicensePlate())
                .vehicleType(v.getVehicleType())
                .imageUrl(v.getImageUrl())
                .createdAt(v.getCreatedAt())
                .build()).toList();
        return ResponseEntity.ok(ApiResponse.ok("Vehicles retrieved", resp));
    }

    @PostMapping("/rooms/{roomId}/vehicles")
    public ResponseEntity<ApiResponse<VehicleResponse>> register(@PathVariable Long roomId, @RequestBody VehicleRequest req) {
        Vehicle v = Vehicle.builder()
                .licensePlate(req.getLicensePlate())
                .vehicleType(req.getVehicleType())
                .imageUrl(req.getImageUrl())
                .build();

        Vehicle saved = vehicleService.register(roomId, v, req.getRenterId());
        VehicleResponse r = VehicleResponse.builder()
                .id(saved.getId())
                .roomId(saved.getRoom() != null ? saved.getRoom().getId() : null)
                .renterId(saved.getRenter() != null ? saved.getRenter().getId() : null)
                .licensePlate(saved.getLicensePlate())
                .vehicleType(saved.getVehicleType())
                .imageUrl(saved.getImageUrl())
                .createdAt(saved.getCreatedAt())
                .build();

        return ResponseEntity.ok(ApiResponse.ok("Vehicle registered", r));
    }

    @DeleteMapping("/vehicles/{vehicleId}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long vehicleId) {
        vehicleService.delete(vehicleId);
        return ResponseEntity.ok(ApiResponse.ok("Vehicle deleted", null));
    }
}
