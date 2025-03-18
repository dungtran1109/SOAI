package com.example.authentication.entity;

import java.time.Instant;

import lombok.*;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthenticationResponse {
    private String token;
    private Instant expiresAt;
    private String tokenType;
    private String role;
}
