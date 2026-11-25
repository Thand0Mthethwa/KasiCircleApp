package com.kasicircle.backend.commerce;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "service_bookings")
class Booking {
    @Id UUID id;
    UUID serviceId;
    UUID customerId;
    UUID providerOwnerId;
    UUID requestKey;
    String serviceName;
    String providerName;
    String customerName;
    String workDescription;
    String serviceArea;
    int durationMinutes;
    Instant requestedAt;
    Instant scheduledAt;
    Instant endsAt;
    @Enumerated(EnumType.STRING) ServiceOffering.PriceModel priceModel;
    BigDecimal agreedPrice;
    Instant proposedAt;
    BigDecimal proposedPrice;
    @Enumerated(EnumType.STRING) Status status;
    @Version Long revision;
    Instant createdAt;
    Instant updatedAt;

    enum Status { REQUESTED, PROPOSED, ACCEPTED, DECLINED, CANCELLED, IN_PROGRESS, COMPLETED, EXPIRED }
    enum Action { ACCEPT, DECLINE, PROPOSE, ACCEPT_PROPOSAL, DECLINE_PROPOSAL, CANCEL, START, COMPLETE }

    Status visibleStatus(Instant now) {
        if ((status == Status.REQUESTED && !scheduledAt.isAfter(now))
                || (status == Status.PROPOSED && !proposedAt.isAfter(now))) {
            return Status.EXPIRED;
        }
        return status;
    }

    void schedule(Instant start) {
        scheduledAt = start;
        endsAt = start.plusSeconds(durationMinutes * 60L);
    }

    void clearProposal() {
        proposedAt = null;
        proposedPrice = null;
    }
}
