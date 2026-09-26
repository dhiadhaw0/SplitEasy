package com.spliteasy.dto.response;

import org.springframework.data.domain.Page;

import java.util.List;

/**
 * A minimal, stable pagination envelope, decoupled from Spring's own Page serialization.
 */
public record PageResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {

    public static <T> PageResponse<T> of(Page<T> page) {
        return new PageResponse<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages()
        );
    }
}
