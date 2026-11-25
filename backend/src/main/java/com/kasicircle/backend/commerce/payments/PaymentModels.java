package com.kasicircle.backend.commerce.payments;

import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static com.kasicircle.backend.commerce.payments.PaymentConfiguration.Provider;

final class PaymentModels {
    private PaymentModels() {}

    enum Kind {
        ORDER("customer_orders", "order_id", "provider_id", "total_minor"),
        BOOKING("service_bookings", "booking_id", "provider_owner_id", "agreed_price * 100");

        final String table;
        final String column;
        final String providerColumn;
        final String amount;

        Kind(String table, String column, String providerColumn, String amount) {
            this.table = table;
            this.column = column;
            this.providerColumn = providerColumn;
            this.amount = amount;
        }
    }

    enum Status {
        PENDING, PROCESSING, PAID, FAILED, ABANDONED, REFUND_REQUIRED;
        boolean outstanding() { return this == PENDING || this == PROCESSING; }
        boolean verified() { return this == PAID || this == REFUND_REQUIRED; }
    }

    record Target(@NotNull Kind kind, @NotNull UUID id) {
        String association() { return kind + ":" + id; }
    }

    record Sale(UUID customerId, UUID providerId, String status, Long amount) {
        boolean payable(Target target) {
            return amount != null && amount >= 100 && ("ACCEPTED".equals(status)
                    || (target.kind == Kind.ORDER && "PLACED".equals(status)));
        }
        boolean closed() {
            return List.of("CANCELLED", "REJECTED", "DECLINED").contains(status);
        }
    }

    record Attempt(UUID id, UUID orderId, UUID bookingId, Provider provider, String reference, long expectedMinor,
                   Long verifiedMinor, Long providerTransactionId, Status status, String checkoutUrl,
                   OffsetDateTime createdAt, OffsetDateTime updatedAt) {
        Target target() { return orderId == null ? new Target(Kind.BOOKING, bookingId) : new Target(Kind.ORDER, orderId); }
    }

    record Prepared(Attempt attempt, boolean created) {}
    record View(Target target, String reference, Provider provider, long amountMinor, String currency,
                Status status, String checkoutUrl, boolean mockCheckout, boolean canVerify, OffsetDateTime createdAt, OffsetDateTime updatedAt) {}
    record History(boolean enabled, boolean canInitialize, Long amountMinor, List<View> attempts) {}
}
