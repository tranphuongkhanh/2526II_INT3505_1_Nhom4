package com.example.Rental.entity;

import com.example.Rental.enums.DurationType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "post_extensions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostExtension {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @Enumerated(EnumType.STRING)
    @Column(name = "duration_type", nullable = false)
    private DurationType durationType;

    @Column(name = "duration_value", nullable = false)
    private Integer durationValue;

    @Column(name = "fee_paid", nullable = false, precision = 12, scale = 2)
    private BigDecimal feePaid;

    @Column(name = "prev_end_date", nullable = false)
    private LocalDateTime prevEndDate;

    @Column(name = "new_end_date", nullable = false)
    private LocalDateTime newEndDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
