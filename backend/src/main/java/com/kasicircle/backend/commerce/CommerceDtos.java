package com.kasicircle.backend.commerce;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import static com.kasicircle.backend.commerce.ServiceOffering.*;

final class CommerceDtos {
    private CommerceDtos() {}

    record ServiceInput(
            @NotBlank @Size(max = 120) String name,
            @NotBlank @Size(max = 2000) String description,
            @Size(max = 255) String category,
            @NotNull PriceModel priceModel,
            @DecimalMin("0.00") @Digits(integer = 10, fraction = 2) BigDecimal price,
            @NotNull @Min(15) @Max(1440) Integer durationMinutes,
            @NotNull Boolean active) {}

    record Offering(UUID id, ProviderType providerType, UUID providerId, String name,
                    String description, String category, PriceModel priceModel, BigDecimal price,
                    int durationMinutes, boolean active, Instant createdAt, Instant updatedAt) {
        static Offering from(ServiceOffering offering) {
            return new Offering(offering.id, offering.providerType,
                    offering.businessId != null ? offering.businessId : offering.workerId,
                    offering.name, offering.description, offering.category, offering.priceModel,
                    offering.price, offering.durationMinutes, offering.active, offering.createdAt, offering.updatedAt);
        }
    }

    record BookingInput(@NotNull UUID serviceId, @NotNull UUID requestKey,
                        @NotBlank @Size(max = 2000) String workDescription,
                        @NotBlank @Size(max = 255) String serviceArea,
                        @NotNull Instant preferredAt) {}

    record Change(@NotNull Booking.Action action, @NotNull @PositiveOrZero Long revision,
                  Instant proposedAt, @DecimalMin("0.00") @Digits(integer = 10, fraction = 2) BigDecimal proposedPrice) {}

    record BookingView(UUID id, UUID serviceId, String serviceName, String providerName, String customerName,
                       String workDescription, String serviceArea, int durationMinutes, Instant scheduledAt,
                       Instant endsAt, PriceModel priceModel, BigDecimal agreedPrice, Instant proposedAt,
                       BigDecimal proposedPrice, Booking.Status status, String paymentStatus,
                       String viewer, long revision, Instant createdAt, Instant updatedAt) {}
}
