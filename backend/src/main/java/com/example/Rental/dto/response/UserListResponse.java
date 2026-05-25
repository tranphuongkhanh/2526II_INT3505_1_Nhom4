package com.example.Rental.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class UserListResponse {
    private long total;
    private int page;
    private int limit;
    private List<UserResponse> items;
}

