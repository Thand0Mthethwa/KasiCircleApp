package com.kasicircle.backend.commerce;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "service_offerings")
class ServiceOffering {
    @Id UUID id;
    UUID providerOwnerId;
    UUID businessId;
    UUID workerId;
    @Enumerated(EnumType.STRING) ProviderType providerType;
    String name;
    String description;
    String category;
    @Enumerated(EnumType.STRING) PriceModel priceModel;
    BigDecimal price;
    int durationMinutes;
    boolean active;
    Instant createdAt;
    Instant updatedAt;

    enum ProviderType { BUSINESS, WORKER }
    enum PriceModel { FIXED, STARTING, QUOTE }
}
