package com.kasicircle.backend.commerce.payments;

interface PaymentGateway {
    enum Outcome { PROCESSING, SUCCESS, FAILED, ABANDONED }

    record Checkout(String reference, long amount, String association, String email) {}
    record Verification(String reference, Long transactionId, long amount, String currency,
                        String environment, String association, Outcome outcome) {}

    String initialize(Checkout checkout);
    Verification verify(String reference);

    class Unavailable extends RuntimeException {
        Unavailable() {
            super("The test provider could not confirm the result. Check the payment again.");
        }
    }
}
