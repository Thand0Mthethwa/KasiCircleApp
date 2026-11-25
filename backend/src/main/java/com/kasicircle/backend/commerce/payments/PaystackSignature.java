package com.kasicircle.backend.commerce.payments;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;

final class PaystackSignature {
    private PaystackSignature() {}

    static boolean valid(byte[] body, String header, String secret, Instant now) {
        if (header == null || header.length() > 4096 || secret.isEmpty()) return false;
        String timestamp = null;
        List<byte[]> signatures = new ArrayList<>();
        for (String segment : header.split(",")) {
            String value = segment.trim();
            if (value.startsWith("t=")) {
                if (timestamp != null) return false;
                timestamp = value.substring(2);
            } else if (value.startsWith("v1=")) {
                String entry = value.substring(3);
                if (entry.matches("whk_[A-Za-z0-9_-]+:[a-f0-9]{128}")) {
                    signatures.add(HexFormat.of().parseHex(entry.substring(entry.indexOf(':') + 1)));
                }
            }
        }
        if (timestamp == null || !timestamp.matches("[0-9]{1,12}") || signatures.isEmpty()) return false;
        long signedAt = Long.parseLong(timestamp);
        long current = now.getEpochSecond();
        if (signedAt < current - 300 || signedAt > current + 300) return false;
        byte[] expected = digest(body, timestamp, secret);
        boolean matches = false;
        for (byte[] signature : signatures) matches |= MessageDigest.isEqual(expected, signature);
        return matches;
    }

    private static byte[] digest(byte[] body, String timestamp, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            mac.update((timestamp + ".").getBytes(StandardCharsets.US_ASCII));
            return mac.doFinal(body);
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("HMAC-SHA512 unavailable", exception);
        }
    }
}
