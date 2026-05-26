package com.example.Rental.repository;

import com.example.Rental.entity.User;
import com.example.Rental.enums.UserRole;
import com.example.Rental.enums.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;

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
}
