package com.example.Rental.dto.response;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CursorPageResponse<T> {
    private List<T> items;
    private Long nextCursor; // Sẽ bằng null nếu đã hết dữ liệu
}