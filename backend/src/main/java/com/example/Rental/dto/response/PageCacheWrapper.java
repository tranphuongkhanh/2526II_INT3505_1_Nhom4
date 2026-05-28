package com.example.Rental.dto.response;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;

@Getter
public class PageCacheWrapper<T> {

    private final List<T> content;
    private final long totalElements;
    private final int pageNumber;
    private final int pageSize;

    @JsonCreator
    public PageCacheWrapper(
            @JsonProperty("content") List<T> content,
            @JsonProperty("totalElements") long totalElements,
            @JsonProperty("pageNumber") int pageNumber,
            @JsonProperty("pageSize") int pageSize) {
        this.content = content;
        this.totalElements = totalElements;
        this.pageNumber = pageNumber;
        this.pageSize = pageSize;
    }

    public static <T> PageCacheWrapper<T> of(Page<T> page) {
        return new PageCacheWrapper<>(
                page.getContent(),
                page.getTotalElements(),
                page.getNumber(),
                page.getSize());
    }

    public Page<T> toPage() {
        return new PageImpl<>(content, PageRequest.of(pageNumber, pageSize), totalElements);
    }
}
