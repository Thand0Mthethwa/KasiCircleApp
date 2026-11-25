package com.kasicircle.backend.commerce.products;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

final class ShopModels {
    private ShopModels() {}

    enum Status { PLACED, ACCEPTED, PREPARING, READY_FOR_COLLECTION, COMPLETED, REJECTED, CANCELLED }

    record Product(UUID id, UUID businessId, UUID imageId, String imageUrl, String name, String description,
                   String category, int priceMinor, boolean available, boolean active, Integer stock,
                   long revision, OffsetDateTime createdAt, OffsetDateTime updatedAt) {
        boolean canSupply(int quantity) {
            return active && available && (stock == null || stock >= quantity);
        }
    }

    record CatalogItem(UUID id, String imageUrl, String name, String description, String category,
                       int priceMinor, boolean available) {
        static CatalogItem from(Product product) {
            return new CatalogItem(product.id(), product.imageUrl(), product.name(), product.description(),
                    product.category(), product.priceMinor(), product.canSupply(1));
        }
    }

    record ProductInput(@NotBlank @Size(max = 120) String name, @NotBlank @Size(max = 2000) String description,
                        @NotBlank @Size(max = 120) String category,
                        @JsonDeserialize(using = WholeNumberDeserializer.class) @NotNull @Min(1) @Max(100000000) Integer priceMinor, @NotNull Boolean available,
                        @NotNull Boolean active, @JsonDeserialize(using = WholeNumberDeserializer.class) @Min(0) @Max(1000000) Integer stock,
                        UUID imageId, @PositiveOrZero Long revision) {}

    record Line(@NotNull UUID productId, @JsonDeserialize(using = WholeNumberDeserializer.class) @NotNull @Min(1) @Max(100) Integer quantity,
                @JsonDeserialize(using = WholeNumberDeserializer.class) @NotNull @Min(1) @Max(100000000) Integer priceMinor) {}

    record ReviewInput(@NotNull UUID businessId, @NotEmpty @Size(max = 30) List<@NotNull @Valid Line> items) {}

    record PlaceInput(@NotNull UUID businessId, @NotNull UUID requestKey, @Size(max = 1000) String notes,
                      @NotEmpty @Size(max = 30) List<@NotNull @Valid Line> items) {}

    record ReviewLine(UUID productId, String name, Integer priceMinor, int quantity, boolean available) {}
    record Review(String businessName, String collectionAddress, List<ReviewLine> items, long totalMinor, boolean ready) {}

    record Order(UUID id, String orderReference, UUID businessId, String businessName, String collectionAddress,
                 UUID customerId, UUID providerId, String customerName, String notes, long totalMinor,
                 Status status, OffsetDateTime createdAt, String requestFingerprint) {}

    record Item(UUID productId, String productName, int quantity, int priceMinor, boolean tracked) {
        long total() { return (long) quantity * priceMinor; }
    }

    record Event(Status status, OffsetDateTime changedAt) {}
    record Summary(UUID id, String orderReference, String businessName, String customerName, long totalMinor,
                   Status status, OffsetDateTime createdAt) {
        static Summary from(Order order) {
            return new Summary(order.id(), order.orderReference(), order.businessName(), order.customerName(),
                    order.totalMinor(), order.status(), order.createdAt());
        }
    }

    record Detail(Summary order, String collectionAddress, String notes, List<Item> items, List<Event> history,
                  List<Status> actions, String paymentStatus) {}

    record Change(@NotNull Status expectedStatus, @NotNull Status status) {}

    record Listing<T>(List<T> content, boolean hasNext) {
        static <T> Listing<T> from(List<T> rows) {
            return new Listing<>(rows.stream().limit(20).toList(), rows.size() > 20);
        }
    }
}
