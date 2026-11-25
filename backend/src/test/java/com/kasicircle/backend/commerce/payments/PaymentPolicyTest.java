package com.kasicircle.backend.commerce.payments;

import org.junit.jupiter.api.Test;
import java.util.UUID;
import static com.kasicircle.backend.commerce.payments.PaymentModels.Status.*;
import static com.kasicircle.backend.commerce.payments.PaymentGateway.Outcome;
import static org.assertj.core.api.Assertions.assertThat;

class PaymentPolicyTest {
    @Test
    void verifiedRecordMustMatchAllAuthoritativeFields() {
        var order = UUID.randomUUID();
        var attempt = new PaymentModels.Attempt(UUID.randomUUID(), order, null, PaymentConfiguration.Provider.PAYSTACK,
                "KC-test", 4500, null, 12L, PROCESSING, null, null, null);
        String link = "ORDER:" + order;
        assertThat(PaymentPolicy.matches(attempt, verify("KC-test", 12L, 4500, "ZAR", "test", link))).isTrue();
        assertThat(PaymentPolicy.matches(attempt, verify("other", 12L, 4500, "ZAR", "test", link))).isFalse();
        assertThat(PaymentPolicy.matches(attempt, verify("KC-test", 13L, 4500, "ZAR", "test", link))).isFalse();
        assertThat(PaymentPolicy.matches(attempt, verify("KC-test", 12L, 4501, "ZAR", "test", link))).isFalse();
        assertThat(PaymentPolicy.matches(attempt, verify("KC-test", 12L, 4500, "USD", "test", link))).isFalse();
        assertThat(PaymentPolicy.matches(attempt, verify("KC-test", 12L, 4500, "ZAR", "live", link))).isFalse();
        assertThat(PaymentPolicy.matches(attempt, verify("KC-test", 12L, 4500, "ZAR", "test", "OTHER"))).isFalse();
    }

    @Test
    void lateSuccessAndStaleEventsRespectVerifiedState() {
        assertThat(PaymentPolicy.next(PROCESSING, Outcome.SUCCESS, true)).isEqualTo(REFUND_REQUIRED);
        assertThat(PaymentPolicy.next(PAID, Outcome.FAILED, false)).isEqualTo(PAID);
        assertThat(PaymentPolicy.next(FAILED, Outcome.PROCESSING, false)).isEqualTo(FAILED);
        assertThat(PaymentPolicy.next(ABANDONED, Outcome.SUCCESS, false)).isEqualTo(PAID);
    }

    private PaymentGateway.Verification verify(String reference, Long id, long amount, String currency,
                                                String domain, String association) {
        return new PaymentGateway.Verification(reference, id, amount, currency, domain, association, Outcome.SUCCESS);
    }
}
