package com.kasicircle.backend.commerce.payments;

import com.kasicircle.backend.notifications.domain.NotificationType;
import com.kasicircle.backend.notifications.service.NotificationService;
import com.kasicircle.backend.users.entity.User;
import com.kasicircle.backend.users.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

import static com.kasicircle.backend.commerce.payments.PaymentModels.*;

@Service
class PaymentService {
    private final PaymentRepository repository;
    private final PaymentConfiguration config;
    private final UserRepository users;
    private final NotificationService notifications;
    private final TransactionTemplate tx;

    PaymentService(PaymentRepository repository, PaymentConfiguration config, UserRepository users,
                   NotificationService notifications, PlatformTransactionManager transactionManager) {
        this.repository = repository;
        this.config = config;
        this.users = users;
        this.notifications = notifications;
        tx = new TransactionTemplate(transactionManager);
    }

    History history(String email, Target target) {
        UUID actor = userId(email);
        Sale sale = sale(target, false);
        boolean customer = sale.customerId().equals(actor);
        if (!customer && !sale.providerId().equals(actor)) throw missing();
        return new History(config.gateway != null, customer && config.gateway != null && sale.payable(target)
                && repository.blockingAttempt(target).isEmpty(), sale.amount(),
                repository.history(target).stream().map(attempt -> view(attempt, sale, customer)).toList());
    }

    View initialize(String email, Target target) {
        UUID customer = userId(email);
        Prepared prepared = tx.execute(transaction -> {
            Sale sale = sale(target, true);
            requireCustomer(customer, sale);
            requireGateway();
            if (!sale.payable(target)) throw conflict("Online payment requires an eligible order or accepted booking of at least R1.");
            Attempt previous = repository.blockingAttempt(target).orElse(null);
            if (previous != null) return new Prepared(previous, false);
            Attempt created = repository.create(target, sale.amount(), config.provider);
            repository.event(created, null, "ATTEMPT_CREATED", created.status());
            return new Prepared(created, true);
        });
        Attempt attempt = prepared.attempt();
        if (prepared.created()) {
            String url = callProvider(() -> config.gateway.initialize(new PaymentGateway.Checkout(
                    attempt.reference(), attempt.expectedMinor(), target.association(), email)));
            tx.executeWithoutResult(transaction -> {
                sale(target, true);
                Attempt current = attempt(attempt.reference());
                if (current.status().outstanding()) {
                    repository.initialized(current, url);
                    repository.event(current, null, "CHECKOUT_INITIALIZED", Status.PROCESSING);
                }
            });
        }
        return status(email, attempt.reference());
    }

    View status(String email, String reference) {
        Attempt attempt = attempt(reference);
        Sale sale = sale(attempt.target(), false);
        UUID user = userId(email);
        if (!sale.customerId().equals(user) && !sale.providerId().equals(user)) throw missing();
        return view(attempt, sale, sale.customerId().equals(user));
    }

    View verify(String email, String reference) {
        Attempt attempt = attempt(reference);
        requireCustomer(userId(email), sale(attempt.target(), false));
        requireGateway();
        if (attempt.provider() != config.provider) throw unavailable();
        if (attempt.status().verified() || (config.provider == PaymentConfiguration.Provider.PAYSTACK
                && !repository.claimManualCheck(attempt))) return status(email, reference);
        PaymentGateway.Verification result = callProvider(() -> config.gateway.verify(reference));
        if (!apply(attempt, result, null, "VERIFICATION", null)) {
            throw conflict("The provider result does not match this payment. The payment remains unconfirmed.");
        }
        return status(email, reference);
    }

    View simulate(String email, String reference, PaymentGateway.Outcome outcome) {
        Attempt attempt = attempt(reference);
        requireCustomer(userId(email), sale(attempt.target(), false));
        if (!(config.gateway instanceof MockPaymentGateway mock)
                || attempt.provider() != PaymentConfiguration.Provider.MOCK) throw missing();
        mock.simulate(reference, outcome);
        return status(email, reference);
    }

    void webhook(String key, String type, String reference, Long providerId) {
        if (repository.hasEvent(key)) return;
        Attempt attempt = reference == null ? null : repository.attempt(reference).orElse(null);
        if (!"charge.success".equals(type) || attempt == null || attempt.provider() != config.provider) {
            repository.event(attempt, key, type, null);
            return;
        }
        PaymentGateway.Verification verified = callProvider(() -> config.gateway.verify(reference));
        if (verified.outcome() != PaymentGateway.Outcome.SUCCESS) throw unavailable();
        apply(attempt, verified, key, type, providerId);
    }

    private boolean apply(Attempt attempt, PaymentGateway.Verification result, String key, String type, Long eventId) {
        return Boolean.TRUE.equals(tx.execute(transaction -> {
            Sale sale = sale(attempt.target(), true);
            Attempt current = attempt(attempt.reference());
            if (key != null && repository.hasEvent(key)) return true;
            if (!PaymentPolicy.matches(current, result) || (eventId != null && !eventId.equals(result.transactionId()))) {
                repository.event(current, key, "VERIFICATION_MISMATCH", null);
                return false;
            }
            boolean needsRefund = sale.closed() || !Long.valueOf(current.expectedMinor()).equals(sale.amount())
                    || repository.hasVerifiedOther(current);
            Status next = PaymentPolicy.next(current.status(), result.outcome(), needsRefund);
            if (next != current.status() || current.providerTransactionId() == null) {
                repository.update(current, next, result.transactionId());
                if (next == Status.REFUND_REQUIRED) repository.refundRequired(current);
                if (next.verified()) {
                    notifications.createNotification(sale.customerId(), NotificationType.PAYMENT_UPDATE,
                            "Test payment updated", "Open your order or booking to view the verified payment result.",
                            current.target().kind().name(), current.target().id());
                }
                repository.event(current, key, type, next);
            } else if (key != null) {
                repository.event(current, key, type, current.status());
            }
            return true;
        }));
    }

    private View view(Attempt attempt, Sale sale, boolean customer) {
        boolean resume = customer && sale.payable(attempt.target()) && attempt.status().outstanding()
                && config.provider == attempt.provider() && repository.blockingAttempt(attempt.target())
                .map(Attempt::id).filter(attempt.id()::equals).isPresent();
        return new View(attempt.target(), attempt.reference(), attempt.provider(), attempt.expectedMinor(), "ZAR",
                attempt.status(), resume ? attempt.checkoutUrl() : null,
                resume && attempt.provider() == PaymentConfiguration.Provider.MOCK && attempt.status() == Status.PROCESSING,
                customer && config.provider == attempt.provider() && !attempt.status().verified(),
                attempt.createdAt(), attempt.updatedAt());
    }

    private UUID userId(String email) {
        return users.findByEmail(email).map(User::getId).orElseThrow(PaymentService::missing);
    }

    private Sale sale(Target target, boolean lock) {
        return repository.sale(target, lock).orElseThrow(PaymentService::missing);
    }

    private Attempt attempt(String reference) {
        return repository.attempt(reference).orElseThrow(PaymentService::missing);
    }

    private void requireCustomer(UUID customer, Sale sale) {
        if (!sale.customerId().equals(customer)) throw missing();
    }

    private void requireGateway() {
        if (config.gateway == null) throw unavailable();
    }

    private <T> T callProvider(java.util.function.Supplier<T> operation) {
        try {
            return operation.get();
        } catch (PaymentGateway.Unavailable error) {
            throw unavailable();
        }
    }

    private static ResponseStatusException missing() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment or transaction not found.");
    }

    private static ResponseStatusException unavailable() {
        return new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Test checkout is unavailable or awaiting provider confirmation.");
    }

    private static ResponseStatusException conflict(String message) {
        return new ResponseStatusException(HttpStatus.CONFLICT, message);
    }
}
