package com.kasicircle.backend.commerce.payments;

import static com.kasicircle.backend.commerce.payments.PaymentModels.*;

final class PaymentPolicy {
    private PaymentPolicy() {}

    static boolean matches(Attempt attempt, PaymentGateway.Verification verification) {
        return attempt.reference().equals(verification.reference())
                && verification.transactionId() != null && verification.transactionId() > 0
                && (attempt.providerTransactionId() == null || attempt.providerTransactionId().equals(verification.transactionId()))
                && verification.amount() == attempt.expectedMinor() && "ZAR".equals(verification.currency())
                && "test".equals(verification.environment()) && attempt.target().association().equals(verification.association());
    }

    static Status next(Status status, PaymentGateway.Outcome outcome, boolean needsRefund) {
        if (status.verified()) return status;
        return switch (outcome) {
            case SUCCESS -> needsRefund ? Status.REFUND_REQUIRED : Status.PAID;
            case FAILED -> status.outstanding() ? Status.FAILED : status;
            case ABANDONED -> status.outstanding() ? Status.ABANDONED : status;
            case PROCESSING -> status.outstanding() ? Status.PROCESSING : status;
        };
    }
}
