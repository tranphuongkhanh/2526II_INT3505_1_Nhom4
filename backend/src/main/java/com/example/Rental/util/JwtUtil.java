package com.example.Rental.util;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Slf4j
@Component
public class JwtUtil {

    // Read jwt.secret from application properties; if missing, fall back to env JWT_SECRET
    @Value("${jwt.secret:}")
    private String secret;

    @Value("${jwt.expiration:86400000}")
    private long expiration;

    public String generateToken(String email, Long userId, String role) {
        return Jwts.builder()
                .setSubject(email)
                .claim("userId", userId)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey())
                .compact();
    }

    public String extractEmail(String token) {
        return extractAllClaims(token).getSubject();
    }

    public Long extractUserId(String token) {
        Object userIdObj = extractAllClaims(token).get("userId");
        if (userIdObj == null)
            return null;
        if (userIdObj instanceof Number) {
            return ((Number) userIdObj).longValue();
        }
        if (userIdObj instanceof String) {
            try {
                return Long.parseLong((String) userIdObj);
            } catch (NumberFormatException e) {
                log.warn("Unable to parse userId from token: {}", userIdObj);
                return null;
            }
        }
        return null;
    }

    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    public boolean isTokenValid(String token, String email) {
        try {
            return extractEmail(token).equals(email) && !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isTokenExpired(String token) {
        try {
            return extractAllClaims(token).getExpiration().before(new Date());
        } catch (ExpiredJwtException e) {
            return true;
        }
    }

    private Claims extractAllClaims(String token) {
        try {
            // Use the parser style compatible with the project's jjwt version/setup
            return Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            log.warn("Expired JWT token: {}", e.getMessage());
            throw e;
        } catch (io.jsonwebtoken.JwtException e) {
            log.error("Invalid JWT token: {}", e.getMessage());
            throw e;
        }
    }

    private SecretKey getSigningKey() {
        if (secret == null || secret.isBlank()) {
            log.error("JWT secret is not configured. Please set 'jwt.secret' property or environment variable JWT_SECRET");
            throw new IllegalStateException("JWT secret is not configured");
        }
        if (secret.getBytes().length < 32) {
            log.warn("JWT secret is too short; recommended at least 32 bytes");
        }
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    public long getRemainingExpiration(String token) {
        try {
            Date expiration = extractAllClaims(token).getExpiration();
            long remaining = expiration.getTime() - System.currentTimeMillis();
            return Math.max(0, remaining);
        } catch (Exception e) {
            return 0;
        }
    }
}
