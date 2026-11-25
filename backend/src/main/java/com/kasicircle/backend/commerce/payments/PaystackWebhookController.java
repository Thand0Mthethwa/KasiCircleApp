package com.kasicircle.backend.commerce.payments;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;

@RestController
@RequiredArgsConstructor
class PaystackWebhookController {
    private static final int MAX_BYTES = 65536;
    private final PaymentConfiguration config;
    private final PaymentService payments;
    private final ObjectMapper json;

    @PostMapping(value = "/api/payments/webhooks/paystack", consumes = "application/json")
    void receive(HttpServletRequest request, @RequestHeader(value = "Paystack-Signature", required = false) String signature)
            throws IOException {
        if (config.gateway == null || config.signingSecret.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Test webhook is unavailable.");
        }
        byte[] body = request.getInputStream().readNBytes(MAX_BYTES + 1);
        if (body.length > MAX_BYTES) throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE);
        if (!PaystackSignature.valid(body, signature, config.signingSecret, Instant.now())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid webhook signature.");
        }
        JsonNode event;
        try {
            event = json.reader().with(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_TRAILING_TOKENS)
                    .readTree(body);
        } catch (IOException exception) {
            throw invalid();
        }
        if (event == null || !event.path("event").isTextual() || !event.path("data").isObject()) throw invalid();
        String type = event.path("event").asText();
        JsonNode data = event.path("data");
        if (!type.matches("[a-z0-9_.]{1,60}")) throw invalid();
        String key = "paystack:" + hash(body);
        String reference = null;
        Long providerId = null;
        if ("charge.success".equals(type)) {
            reference = data.path("reference").asText();
            var id = data.path("id");
            if (!data.path("reference").isTextual() || !reference.matches("[A-Za-z0-9.=\\-]{1,64}")
                    || !id.isIntegralNumber() || !id.canConvertToLong() || id.longValue() <= 0
                    || !"success".equals(data.path("status").asText()) || !"test".equals(data.path("domain").asText())) {
                throw invalid();
            }
            providerId = id.longValue();
            key = "paystack:test:charge.success:" + providerId + ":" + reference;
        }
        payments.webhook(key, type, reference, providerId);
    }

    private static String hash(byte[] body) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(body));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 unavailable", exception);
        }
    }

    private static ResponseStatusException invalid() {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid test webhook event.");
    }
}
