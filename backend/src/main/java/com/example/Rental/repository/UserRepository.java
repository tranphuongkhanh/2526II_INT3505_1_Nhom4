package com.example.Rental.repository;

import com.example.Rental.entity.User;
import com.example.Rental.enums.UserRole;
import com.example.Rental.enums.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    Optional<User> findByResetToken(String resetToken);
    List<User> findByRole(UserRole role);
    long countByRole(UserRole role);
    long countByStatus(UserStatus status);

    // Pageable queries for listing with filters
    Page<User> findByRole(UserRole role, Pageable pageable);
    Page<User> findByStatus(UserStatus status, Pageable pageable);
    Page<User> findByRoleAndStatus(UserRole role, UserStatus status, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.role = 'RENTER' AND (LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%')) OR u.phone LIKE CONCAT('%', :q, '%') OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :q, '%')))")
    List<User> searchRenters(@Param("q") String q, Pageable pageable);
}
