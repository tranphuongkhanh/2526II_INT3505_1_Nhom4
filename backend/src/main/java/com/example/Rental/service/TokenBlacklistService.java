package com.example.Rental.service;

import org.springframework.stereotype.Service;

import com.example.Rental.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class TokenBlacklistService {

    private final JwtUtil jwtUtil;
    private final Set<String> blacklist = ConcurrentHashMap.newKeySet();

    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();

    public void addToBlacklist(String token) {
        blacklist.add(token);
        log.info("Token added to blacklist");

        long remainingValidity = jwtUtil.getRemainingExpiration(token);

        if (remainingValidity > 0) {
            scheduler.schedule(
                    () -> {
                        blacklist.remove(token);
                        log.info("Expired token removed from blacklist");
                    },
                    remainingValidity,
                    TimeUnit.MILLISECONDS);
        }
    }

    public boolean isTokenBlacklisted(String token) {
        return blacklist.contains(token);
    }
}
