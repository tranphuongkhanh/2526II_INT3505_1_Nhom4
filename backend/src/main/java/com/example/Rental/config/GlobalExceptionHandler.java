package com.example.Rental.config;

import com.example.Rental.dto.response.ApiResponse;
import com.example.Rental.exception.EntityNotFoundException;
import com.example.Rental.exception.UnauthorizedException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.async.AsyncRequestNotUsableException;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<?>> handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
            errors.put(error.getField(), error.getDefaultMessage())
        );
        return ResponseEntity.badRequest().body(ApiResponse.error("Validation failed: " + errors));
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleEntityNotFound(EntityNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<?>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiResponse<?>> handleResponseStatus(UnauthorizedException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse<?>> handleRuntime(RuntimeException ex) {
        log.error("Runtime exception occurred", ex);
        return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
    }

    /**
     * Client đã đóng kết nối trước khi server kịp ghi xong response
     * (Broken pipe / ClientAbortException). Không thể gửi response nữa nên
     * chỉ log ở mức debug để tránh spam stacktrace và trả về null để
     * Spring bỏ qua việc ghi body.
     */
    @ExceptionHandler(AsyncRequestNotUsableException.class)
    public ResponseEntity<ApiResponse<?>> handleClientAbort(AsyncRequestNotUsableException ex) {
        log.debug("Client closed the connection before response completed: {}", ex.getMessage());
        return null;
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> handleException(Exception ex) {
        if (isClientAbort(ex)) {
            log.debug("Client closed the connection before response completed: {}", ex.getMessage());
            return null;
        }
        log.error("Exception occurred", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error("Internal server error"));
    }

    private boolean isClientAbort(Throwable ex) {
        for (Throwable t = ex; t != null; t = t.getCause()) {
            String name = t.getClass().getName();
            if (name.endsWith("ClientAbortException")) return true;
            if (t instanceof java.io.IOException && "Broken pipe".equalsIgnoreCase(t.getMessage())) return true;
        }
        return false;
    }
}
