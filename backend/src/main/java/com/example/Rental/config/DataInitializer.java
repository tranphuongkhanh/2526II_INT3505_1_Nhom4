package com.example.Rental.config;

import com.example.Rental.entity.User;
import com.example.Rental.enums.UserRole;
import com.example.Rental.enums.UserStatus;
import com.example.Rental.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.findByEmail("admin@rental.com").isEmpty()) {
            User admin = User.builder()
                    .email("admin@rental.com")
                    .username("admin")
                    .passwordHash(passwordEncoder.encode("Admin@123"))
                    .fullName("Administrator")
                    .phone("0000000000")
                    .role(UserRole.ADMIN)
                    .status(UserStatus.ACTIVE)
                    .build();
            userRepository.save(admin);
            log.info("Default admin account created: admin@rental.com / Admin@123");
        }
    }
}
