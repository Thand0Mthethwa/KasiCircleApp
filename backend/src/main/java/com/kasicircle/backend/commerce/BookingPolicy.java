package com.kasicircle.backend.commerce;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static com.kasicircle.backend.commerce.Booking.Status.*;

final class BookingPolicy {
    private BookingPolicy() {}

    static boolean change(Booking booking, CommerceDtos.Change request, boolean provider, Instant now) {
        Booking.Status status = booking.visibleStatus(now);
        boolean confirmsSlot = false;
        switch (request.action()) {
            case ACCEPT -> {
                require(provider && status == REQUESTED, "This request can no longer be accepted.");
                require(booking.priceModel == ServiceOffering.PriceModel.FIXED,
                        "Send a price proposal for the customer to accept.");
                booking.status = ACCEPTED;
                confirmsSlot = true;
            }
            case DECLINE -> {
                require(provider && (status == REQUESTED || status == PROPOSED), "This request cannot be declined.");
                booking.status = DECLINED;
            }
            case PROPOSE -> {
                require(provider && (status == REQUESTED || status == PROPOSED),
                        "Only open requests can be changed. Cancel an accepted booking and submit a new request to reschedule it.");
                if (request.proposedAt() == null || request.proposedPrice() == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a proposed time and price.");
                }
                booking.proposedAt = futureSlot(request.proposedAt(), now);
                booking.proposedPrice = request.proposedPrice();
                booking.status = PROPOSED;
            }
            case ACCEPT_PROPOSAL -> {
                require(!provider && status == PROPOSED, "This proposal can no longer be accepted.");
                booking.schedule(booking.proposedAt);
                booking.agreedPrice = booking.proposedPrice;
                booking.status = ACCEPTED;
                confirmsSlot = true;
            }
            case DECLINE_PROPOSAL -> {
                require(!provider && status == PROPOSED, "This proposal can no longer be declined.");
                booking.status = DECLINED;
            }
            case CANCEL -> {
                require(status == REQUESTED || status == PROPOSED || status == ACCEPTED,
                        "Only open or accepted bookings can be cancelled before work starts.");
                booking.status = CANCELLED;
            }
            case START -> {
                require(provider && status == ACCEPTED && !now.isBefore(booking.scheduledAt),
                        "Work can start from the accepted time.");
                booking.status = IN_PROGRESS;
            }
            case COMPLETE -> {
                require(provider && status == IN_PROGRESS, "Start the work before marking it complete.");
                booking.status = COMPLETED;
            }
        }
        if (booking.status != PROPOSED) booking.clearProposal();
        return confirmsSlot;
    }

    static Instant futureSlot(Instant value, Instant now) {
        Instant slot = value.truncatedTo(ChronoUnit.MICROS);
        if (!slot.isAfter(now) || slot.isAfter(now.plus(365, ChronoUnit.DAYS))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a future time within the next year.");
        }
        return slot;
    }

    private static void require(boolean allowed, String reason) {
        if (!allowed) throw new ResponseStatusException(HttpStatus.CONFLICT, reason);
    }
}
