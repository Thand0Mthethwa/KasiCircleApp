package com.kasicircle.backend.commerce.products;

import java.util.List;

import static com.kasicircle.backend.commerce.products.ShopModels.Status;
import static com.kasicircle.backend.commerce.products.ShopModels.Status.*;

final class OrderPolicy {
    private OrderPolicy() {}

    static List<Status> actions(Status status, boolean provider, boolean customer) {
        if (customer) return status == PLACED ? List.of(CANCELLED) : List.of();
        if (!provider) return List.of();
        return switch (status) {
            case PLACED -> List.of(ACCEPTED, REJECTED);
            case ACCEPTED -> List.of(PREPARING, CANCELLED);
            case PREPARING -> List.of(READY_FOR_COLLECTION);
            case READY_FOR_COLLECTION -> List.of(COMPLETED);
            default -> List.of();
        };
    }
}
