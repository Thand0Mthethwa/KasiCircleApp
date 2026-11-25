package com.kasicircle.backend.commerce.payments;

import java.util.concurrent.ConcurrentHashMap;
import java.util.UUID;

final class MockPaymentGateway implements PaymentGateway {
    private final ConcurrentHashMap<String, Verification> payments = new ConcurrentHashMap<>();

    @Override
    public String initialize(Checkout checkout) {
        long id = UUID.fromString(checkout.reference().substring(3)).getMostSignificantBits() & Long.MAX_VALUE;
        payments.putIfAbsent(checkout.reference(), new Verification(checkout.reference(), Math.max(1, id),
                checkout.amount(), "ZAR", "test", checkout.association(), Outcome.PROCESSING));
        return null;
    }

    @Override
    public Verification verify(String reference) {
        Verification result = payments.get(reference);
        if (result == null) throw new Unavailable();
        return result;
    }

    void simulate(String reference, Outcome outcome) {
        payments.computeIfPresent(reference, (key, previous) -> previous.outcome() == Outcome.SUCCESS ? previous
                : new Verification(key, previous.transactionId(), previous.amount(), previous.currency(),
                previous.environment(), previous.association(), outcome));
    }
}
