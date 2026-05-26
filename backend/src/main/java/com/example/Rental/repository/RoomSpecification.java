package com.example.Rental.repository;

import com.example.Rental.dto.request.RoomFilterRequest;
import com.example.Rental.entity.Room;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import java.util.ArrayList;
import java.util.List;

public class RoomSpecification {

    public static Specification<Room> filterRooms(Long ownerId, RoomFilterRequest filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Điều kiện cứng (Bắt buộc): So sánh qua owner.id của association và deletedAt
            predicates.add(cb.equal(root.get("owner").get("id"), ownerId));
            predicates.add(cb.isNull(root.get("deletedAt")));

            // 2. Lọc động: Chỉ thêm vào SQL nếu filter có dữ liệu (khác null)
            if (filter != null) {
                // Sửa từ "status" thành "rentalStatus" để khớp với Room entity
                if (filter.getStatus() != null) {
                    predicates.add(cb.equal(root.get("rentalStatus"), filter.getStatus()));
                }

                if (filter.getRoomType() != null) {
                    predicates.add(cb.equal(root.get("roomType"), filter.getRoomType()));
                }

                // Lọc theo giá
                if (filter.getMinPrice() != null) {
                    predicates.add(cb.greaterThanOrEqualTo(root.get("price"), filter.getMinPrice()));
                }

                if (filter.getMaxPrice() != null) {
                    predicates.add(cb.lessThanOrEqualTo(root.get("price"), filter.getMaxPrice()));
                }

                // Sửa từ "area" thành "areaMq" để khớp với Room entity
                if (filter.getMinArea() != null) {
                    predicates.add(cb.greaterThanOrEqualTo(root.get("areaMq"), filter.getMinArea()));
                }

                // Lọc theo địa điểm
                if (filter.getCity() != null && !filter.getCity().trim().isEmpty()) {
                    predicates.add(cb.equal(root.get("city"), filter.getCity()));
                }

                if (filter.getDistrict() != null && !filter.getDistrict().trim().isEmpty()) {
                    predicates.add(cb.equal(root.get("district"), filter.getDistrict()));
                }

                if (filter.getWard() != null && !filter.getWard().trim().isEmpty()) {
                    predicates.add(cb.equal(root.get("ward"), filter.getWard()));
                }

                // Lọc theo tiện ích (Boolean)
                if (filter.getHasAc() != null) {
                    predicates.add(cb.equal(root.get("hasAc"), filter.getHasAc()));
                }
                if (filter.getHasFridge() != null) {
                    predicates.add(cb.equal(root.get("hasFridge"), filter.getHasFridge()));
                }
                if (filter.getHasPrivateWc() != null) {
                    predicates.add(cb.equal(root.get("hasPrivateWc"), filter.getHasPrivateWc()));
                }
                if (filter.getHasSecurity() != null) {
                    predicates.add(cb.equal(root.get("hasSecurity"), filter.getHasSecurity()));
                }

                // Lọc theo các phí dịch vụ tối thiểu
                if (filter.getMinWifiFee() != null) {
                    predicates.add(cb.greaterThanOrEqualTo(root.get("wifiFee"), filter.getMinWifiFee()));
                }
                if (filter.getMinWaterPricePerUnit() != null) {
                    predicates.add(cb.greaterThanOrEqualTo(root.get("waterPricePerUnit"), filter.getMinWaterPricePerUnit()));
                }
                if (filter.getMinElectricityPricePerUnit() != null) {
                    predicates.add(cb.greaterThanOrEqualTo(root.get("electricityPricePerUnit"), filter.getMinElectricityPricePerUnit()));
                }
                if (filter.getMinServiceFee() != null) {
                    predicates.add(cb.greaterThanOrEqualTo(root.get("serviceFee"), filter.getMinServiceFee()));
                }
                if (filter.getMinBikeParkingFee() != null) {
                    predicates.add(cb.greaterThanOrEqualTo(root.get("bikeParkingFee"), filter.getMinBikeParkingFee()));
                }
                if (filter.getMinDeposit() != null) {
                    predicates.add(cb.greaterThanOrEqualTo(root.get("deposit"), filter.getMinDeposit()));
                }

                // Lọc theo đánh giá trung bình
                if (filter.getMinAvgRating() != null) {
                    predicates.add(cb.greaterThanOrEqualTo(root.get("avgRating"), filter.getMinAvgRating()));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}