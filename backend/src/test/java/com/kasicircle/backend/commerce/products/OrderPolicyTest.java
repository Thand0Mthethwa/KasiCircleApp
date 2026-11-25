package com.kasicircle.backend.commerce.products;

import org.junit.jupiter.api.Test;

import static com.kasicircle.backend.commerce.products.ShopModels.Status.*;
import static org.assertj.core.api.Assertions.assertThat;

class OrderPolicyTest {
    @Test
    void sellerMustFollowCollectionSequenceAndTerminalOrdersStayClosed() {
        assertThat(OrderPolicy.actions(PLACED, true, false)).containsExactly(ACCEPTED, REJECTED);
        assertThat(OrderPolicy.actions(ACCEPTED, true, false)).containsExactly(PREPARING, CANCELLED);
        assertThat(OrderPolicy.actions(PREPARING, true, false)).containsExactly(READY_FOR_COLLECTION);
        assertThat(OrderPolicy.actions(READY_FOR_COLLECTION, true, false)).containsExactly(COMPLETED);
        for (var terminal : new ShopModels.Status[]{COMPLETED, REJECTED, CANCELLED}) {
            assertThat(OrderPolicy.actions(terminal, true, false)).isEmpty();
            assertThat(OrderPolicy.actions(terminal, false, true)).isEmpty();
        }
    }

    @Test
    void buyerCanOnlyCancelBeforeSellerAcceptance() {
        assertThat(OrderPolicy.actions(PLACED, false, true)).containsExactly(CANCELLED);
        assertThat(OrderPolicy.actions(ACCEPTED, false, true)).isEmpty();
        assertThat(OrderPolicy.actions(PLACED, false, false)).isEmpty();
    }
}
