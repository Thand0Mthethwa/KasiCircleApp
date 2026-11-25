package com.kasicircle.backend.commerce.payments;

import org.junit.jupiter.api.Test;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HexFormat;
import static org.assertj.core.api.Assertions.assertThat;

class PaystackSignatureTest {
    @Test
    void signatureRequiresFreshTimestampAndUnmodifiedBytes() throws Exception {
        var secret = "whsec_controlled_fixture";
        var now = Instant.ofEpochSecond(1800000000);
        byte[] body = "{ \"event\": \"charge.success\" }".getBytes(StandardCharsets.UTF_8);
        String header = signature(secret, body, now);
        assertThat(PaystackSignature.valid(body, header, secret, now)).isTrue();
        assertThat(PaystackSignature.valid(body, header, secret, now.plusSeconds(301))).isFalse();
        assertThat(PaystackSignature.valid(body, header, secret, now.minusSeconds(301))).isFalse();
        assertThat(PaystackSignature.valid(body, header + ",t=1800000000", secret, now)).isFalse();
        assertThat(PaystackSignature.valid(body, header, "whsec_other", now)).isFalse();
        assertThat(PaystackSignature.valid("{} ".getBytes(StandardCharsets.UTF_8), header, secret, now)).isFalse();
    }

    private String signature(String secret, byte[] body, Instant now) throws Exception {
        var mac = Mac.getInstance("HmacSHA512");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
        mac.update((now.getEpochSecond() + ".").getBytes(StandardCharsets.US_ASCII));
        return "t=" + now.getEpochSecond() + ",v1=whk_example:" + HexFormat.of().formatHex(mac.doFinal(body));
    }
}
