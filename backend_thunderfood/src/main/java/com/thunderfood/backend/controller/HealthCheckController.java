package com.thunderfood.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
@RequiredArgsConstructor
public class HealthCheckController {

    private final DataSource dataSource;

    @GetMapping
    public ResponseEntity<Map<String, Object>> checkHealth() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "ThunderFood Backend");
        response.put("timestamp", LocalDateTime.now().toString());

        // Kiểm tra kết nối Database (TiDB Cloud)
        try (Connection connection = dataSource.getConnection()) {
            if (connection.isValid(2)) {
                response.put("database", "CONNECTED (TiDB Cloud)");
            } else {
                response.put("database", "DISCONNECTED");
            }
        } catch (Exception e) {
            response.put("database", "ERROR: " + e.getMessage());
            response.put("status", "DOWN");
            return ResponseEntity.status(503).body(response);
        }

        return ResponseEntity.ok(response);
    }
}
