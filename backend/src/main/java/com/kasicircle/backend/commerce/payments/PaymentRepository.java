package com.kasicircle.backend.commerce.payments;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static com.kasicircle.backend.commerce.payments.PaymentConfiguration.Provider;
import static com.kasicircle.backend.commerce.payments.PaymentModels.*;

@Repository
@RequiredArgsConstructor
class PaymentRepository {
    private final JdbcClient jdbc;

    Optional<Sale> sale(Target target, boolean lock) {
        var kind = target.kind();
        return jdbc.sql("SELECT customer_id, " + kind.providerColumn + " AS provider_id, status, "
                + kind.amount + " AS amount FROM " + kind.table + " WHERE id = :id" + (lock ? " FOR UPDATE" : ""))
                .param("id", target.id()).query((rs, row) -> {
                    var amount = rs.getBigDecimal("amount");
                    return new Sale(rs.getObject("customer_id", UUID.class), rs.getObject("provider_id", UUID.class),
                            rs.getString("status"), amount == null ? null : amount.longValueExact());
                }).optional();
    }

    Optional<Attempt> attempt(String reference) {
        return jdbc.sql("SELECT * FROM payment_attempts WHERE reference = :ref")
                .param("ref", reference).query(Attempt.class).optional();
    }

    List<Attempt> history(Target target) {
        return jdbc.sql("SELECT * FROM payment_attempts WHERE " + target.kind().column + " = :id ORDER BY created_at DESC, id LIMIT 50")
                .param("id", target.id()).query(Attempt.class).list();
    }

    Optional<Attempt> blockingAttempt(Target target) {
        return jdbc.sql("""
                SELECT * FROM payment_attempts WHERE %s = :id AND status IN ('PENDING','PROCESSING','PAID','REFUND_REQUIRED')
                ORDER BY CASE WHEN status IN ('PAID','REFUND_REQUIRED') THEN 0 ELSE 1 END, created_at DESC LIMIT 1
                """.formatted(target.kind().column))
                .param("id", target.id()).query(Attempt.class).optional();
    }

    boolean hasVerifiedOther(Attempt attempt) {
        var target = attempt.target();
        return jdbc.sql("SELECT EXISTS(SELECT 1 FROM payment_attempts WHERE " + target.kind().column
                + " = :target AND id <> :id AND status = 'PAID')")
                .param("target", target.id()).param("id", attempt.id()).query(Boolean.class).single();
    }

    Attempt create(Target target, long amount, Provider provider) {
        UUID id = UUID.randomUUID();
        return jdbc.sql("""
                INSERT INTO payment_attempts (id, %s, provider, reference, expected_minor, currency, status)
                VALUES (:id, :target, :provider, :reference, :amount, 'ZAR', 'PENDING') RETURNING *
                """.formatted(target.kind().column))
                .param("id", id).param("target", target.id()).param("provider", provider.name())
                .param("reference", "KC-" + id).param("amount", amount).query(Attempt.class).single();
    }

    void initialized(Attempt attempt, String url) {
        jdbc.sql("""
                UPDATE payment_attempts SET checkout_url = :url, status = 'PROCESSING', updated_at = clock_timestamp()
                WHERE id = :id AND status IN ('PENDING', 'PROCESSING')
                """).param("id", attempt.id()).param("url", url).update();
    }

    boolean claimManualCheck(Attempt attempt) {
        return jdbc.sql("""
                UPDATE payment_attempts SET last_check_at = clock_timestamp()
                WHERE id = :id AND (last_check_at IS NULL OR last_check_at < clock_timestamp() - interval '2 seconds')
                """).param("id", attempt.id()).update() == 1;
    }

    void update(Attempt attempt, Status status, Long transactionId) {
        jdbc.sql("""
                UPDATE payment_attempts SET status = :status, verified_minor = :amount, provider_transaction_id = :providerId,
                    checkout_url = CASE WHEN :outstanding THEN checkout_url ELSE NULL END, updated_at = clock_timestamp()
                WHERE id = :id
                """).param("status", status.name()).param("amount", status.verified() ? attempt.expectedMinor() : null)
                .param("providerId", transactionId).param("outstanding", status.outstanding()).param("id", attempt.id()).update();
    }

    boolean event(Attempt attempt, String key, String type, Status status) {
        return jdbc.sql("""
                INSERT INTO payment_events(payment_id, event_key, event_type, status)
                VALUES (:id, :key, :type, :status) ON CONFLICT (event_key) DO NOTHING
                """).param("id", attempt == null ? null : attempt.id()).param("key", key)
                .param("type", type).param("status", status == null ? null : status.name()).update() == 1;
    }

    boolean hasEvent(String key) {
        return jdbc.sql("SELECT EXISTS(SELECT 1 FROM payment_events WHERE event_key = :key)")
                .param("key", key).query(Boolean.class).single();
    }

    void refundRequired(Attempt attempt) {
        jdbc.sql("INSERT INTO payment_cases(payment_id, kind, state) VALUES (:id, 'REFUND', 'REQUIRED') ON CONFLICT DO NOTHING")
                .param("id", attempt.id()).update();
    }
}
