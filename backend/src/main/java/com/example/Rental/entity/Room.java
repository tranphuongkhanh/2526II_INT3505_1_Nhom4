package com.example.Rental.entity;

import com.example.Rental.enums.RentalStatus;
import com.example.Rental.enums.RoomType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "rooms")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(name = "area_m2", nullable = false)
    private Double areaMq;

    @Enumerated(EnumType.STRING)
    @Column(name = "room_type", nullable = false)
    private RoomType roomType;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private String ward;

    @Column(nullable = false)
    private String district;

    @Column(nullable = false)
    private String city;

    @Column(name = "has_ac")
    private Boolean hasAc = false;

    @Column(name = "has_fridge")
    private Boolean hasFridge = false;

    @Column(name = "has_private_wc")
    private Boolean hasPrivateWc = false;

    @Column(name = "has_security")
    private Boolean hasSecurity = false;

    @Column(name = "wifi_fee", precision = 12, scale = 2)
    private BigDecimal wifiFee;

    @Column(name = "water_price_per_unit", precision = 12, scale = 2)
    private BigDecimal waterPricePerUnit;

    @Column(name = "electricity_price_per_unit", precision = 12, scale = 2)
    private BigDecimal electricityPricePerUnit;

    @Column(name = "service_fee", precision = 12, scale = 2)
    private BigDecimal serviceFee;

    @Column(name = "bike_parking_fee", precision = 12, scale = 2)
    private BigDecimal bikeParkingFee;

    @Column(name = "deposit", precision = 12, scale = 2)
    private BigDecimal deposit;

    @Enumerated(EnumType.STRING)
    @Column(name = "rental_status")
    private RentalStatus rentalStatus = RentalStatus.AVAILABLE;

    @Column(name = "avg_rating")
    private Double avgRating = 0.0;

    @Column(name = "review_count")
    private Integer reviewCount = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @JsonIgnore
    @OneToMany(mappedBy = "room", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private List<RoomImage> images;

    @JsonIgnore
    @OneToMany(mappedBy = "room", fetch = FetchType.LAZY)
    private List<Post> posts;
}
