package com.kasicircle.backend.auth.jwt;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class JwtServiceTest {

    @Test
    void rejectsSigningSecretsShorterThan32Bytes() {
        assertThrows(IllegalArgumentException.class, () -> new JwtService("too-short", 60_000));
    }

    @Test
    void rejectsNonPositiveTokenExpiration() {
        assertThrows(IllegalArgumentException.class,
                () -> new JwtService("ThisIsAValidTestJwtSecretKeyForHmac256!", 0));
    }

    @Test
    void acceptsSecureSigningKeyAndPositiveExpiration() {
        assertDoesNotThrow(() -> new JwtService("ThisIsAValidTestJwtSecretKeyForHmac256!", 60_000));
    }
}
