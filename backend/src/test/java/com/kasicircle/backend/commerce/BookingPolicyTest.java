package com.kasicircle.backend.commerce;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static com.kasicircle.backend.commerce.Booking.Action.*;
import static com.kasicircle.backend.commerce.Booking.Status.*;
import static com.kasicircle.backend.commerce.ServiceOffering.PriceModel.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class BookingPolicyTest {
    private static final Instant NOW = Instant.parse("2030-01-01T08:00:00Z");

    @Test
    void fixedBookingGoesFromRequestToCompletionAtTheAgreedTime() {
        Booking booking = booking(FIXED);
        assertThat(BookingPolicy.change(booking, change(ACCEPT), true, NOW)).isTrue();
        assertThat(booking.status).isEqualTo(ACCEPTED);
        assertThatThrownBy(() -> BookingPolicy.change(booking, change(START), true, NOW))
                .isInstanceOf(ResponseStatusException.class);
        BookingPolicy.change(booking, change(START), true, booking.scheduledAt);
        assertThat(booking.status).isEqualTo(IN_PROGRESS);
        assertThatThrownBy(() -> BookingPolicy.change(booking, change(CANCEL), false, booking.scheduledAt))
                .isInstanceOf(ResponseStatusException.class);
        BookingPolicy.change(booking, change(COMPLETE), true, booking.scheduledAt);
        assertThat(booking.status).isEqualTo(COMPLETED);
    }

    @Test
    void quoteRequiresCustomerApprovalOfTheNewScheduleAndPrice() {
        Booking booking = booking(QUOTE);
        assertThatThrownBy(() -> BookingPolicy.change(booking, change(ACCEPT), true, NOW))
                .isInstanceOf(ResponseStatusException.class);
        Instant alternate = NOW.plus(2, ChronoUnit.HOURS);
        BigDecimal quote = new BigDecimal("300.50");
        assertThat(BookingPolicy.change(booking, new CommerceDtos.Change(PROPOSE, 0L, alternate, quote), true, NOW))
                .isFalse();
        assertThat(booking.status).isEqualTo(PROPOSED);
        assertThatThrownBy(() -> BookingPolicy.change(booking, change(ACCEPT_PROPOSAL), true, NOW))
                .isInstanceOf(ResponseStatusException.class);
        assertThat(BookingPolicy.change(booking, change(ACCEPT_PROPOSAL), false, NOW)).isTrue();
        assertThat(booking.status).isEqualTo(ACCEPTED);
        assertThat(booking.scheduledAt).isEqualTo(alternate);
        assertThat(booking.endsAt).isEqualTo(alternate.plus(1, ChronoUnit.HOURS));
        assertThat(booking.agreedPrice).isEqualByComparingTo(quote);
        assertThat(booking.proposedAt).isNull();
    }

    @Test
    void pastRequestsAndProposalsExpireAtTheirRespectiveScheduledTimes() {
        Booking booking = booking(STARTING);
        assertThat(booking.visibleStatus(booking.scheduledAt)).isEqualTo(EXPIRED);
        Instant alternate = NOW.plus(2, ChronoUnit.HOURS);
        BookingPolicy.change(booking, new CommerceDtos.Change(PROPOSE, 0L, alternate, BigDecimal.TEN), true, NOW);
        assertThat(booking.visibleStatus(booking.scheduledAt)).isEqualTo(PROPOSED);
        assertThat(booking.visibleStatus(alternate)).isEqualTo(EXPIRED);
        assertThatThrownBy(() -> BookingPolicy.change(booking, change(ACCEPT_PROPOSAL), false, alternate))
                .isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> BookingPolicy.futureSlot(NOW.plus(366, ChronoUnit.DAYS), NOW))
                .isInstanceOf(ResponseStatusException.class);
    }

    private Booking booking(ServiceOffering.PriceModel priceModel) {
        Booking booking = new Booking();
        booking.status = REQUESTED;
        booking.priceModel = priceModel;
        booking.durationMinutes = 60;
        booking.schedule(NOW.plus(1, ChronoUnit.HOURS));
        return booking;
    }

    private CommerceDtos.Change change(Booking.Action action) {
        return new CommerceDtos.Change(action, 0L, null, null);
    }
}
