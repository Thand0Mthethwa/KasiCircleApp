package com.kasicircle.backend.commerce.products;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static com.kasicircle.backend.commerce.products.ShopModels.*;

@Repository
@RequiredArgsConstructor
class ShopRepository {
    private static final String PRODUCTS = """
        SELECT p.*, i.image_url FROM products p LEFT JOIN business_images i
          ON i.id = p.image_id AND i.business_id = p.business_id
        """;
    private final JdbcClient jdbc;

    List<Product> products(UUID businessId, boolean published, long offset) {
        return jdbc.sql(PRODUCTS + " WHERE p.business_id = :id "
                        + (published ? "AND p.active " : "") + "ORDER BY p.created_at DESC, p.id LIMIT 21 OFFSET :offset")
                .param("id", businessId).param("offset", offset).query(Product.class).list();
    }

    Optional<Product> product(UUID businessId, UUID id) {
        return jdbc.sql(PRODUCTS + " WHERE p.business_id = :business AND p.id = :id")
                .param("business", businessId).param("id", id).query(Product.class).optional();
    }

    List<Product> productsForReview(UUID businessId, List<UUID> ids) {
        return jdbc.sql(PRODUCTS + " WHERE p.business_id = :business AND p.id IN (:ids)")
                .param("business", businessId).param("ids", ids).query(Product.class).list();
    }

    void saveProduct(UUID id, UUID businessId, ProductInput input, boolean create) {
        String sql = create ? """
            INSERT INTO products (id, business_id, name, description, category, price_minor, available, active, stock, image_id)
            VALUES (:id, :business, :name, :description, :category, :price, :available, :active, :stock, :image)
            """ : """
            UPDATE products SET name = :name, description = :description, category = :category, price_minor = :price,
                available = :available, active = :active, stock = :stock, image_id = :image,
                revision = revision + 1, updated_at = now()
            WHERE id = :id AND business_id = :business AND revision = :revision
            """;
        var statement = jdbc.sql(sql).param("id", id).param("business", businessId)
                .param("name", input.name().trim()).param("description", input.description().trim())
                .param("category", input.category().trim()).param("price", input.priceMinor())
                .param("available", input.available()).param("active", input.active())
                .param("stock", input.stock()).param("image", input.imageId());
        if (!create) statement.param("revision", input.revision());
        if (statement.update() != 1) throw ShopService.conflict("This product has changed. Reload before saving.");
    }

    boolean hasReservedStock(UUID productId) {
        return jdbc.sql("""
            SELECT EXISTS (
                SELECT 1 FROM customer_order_items i JOIN customer_orders o ON o.id = i.order_id
                WHERE i.product_id = :id AND i.tracked AND o.status IN ('PLACED', 'ACCEPTED')
            )
            """).param("id", productId).query(Boolean.class).single();
    }

    void changeStock(UUID id, int difference) {
        int updated = jdbc.sql("""
            UPDATE products SET stock = stock + :difference, revision = revision + 1, updated_at = now()
            WHERE id = :id AND stock IS NOT NULL AND stock + :difference >= 0
            """).param("id", id).param("difference", difference).update();
        if (updated == 0 && difference < 0) throw ShopService.conflict("Stock has changed. Review your cart again.");
    }

    void lockCustomer(UUID customer) {
        jdbc.sql("SELECT pg_advisory_xact_lock(hashtextextended(:key, 0))")
                .param("key", "order:" + customer).query((rs, row) -> Boolean.TRUE).single();
    }

    Optional<Order> replay(UUID customer, UUID key) {
        return jdbc.sql("SELECT * FROM customer_orders WHERE customer_id = :customer AND request_key = :key")
                .param("customer", customer).param("key", key).query(Order.class).optional();
    }

    Optional<Order> order(UUID id) {
        return jdbc.sql("SELECT * FROM customer_orders WHERE id = :id")
                .param("id", id).query(Order.class).optional();
    }

    List<Order> orders(UUID userId, boolean incoming, long offset) {
        String column = incoming ? "provider_id" : "customer_id";
        return jdbc.sql("SELECT * FROM customer_orders WHERE " + column
                        + " = :user ORDER BY created_at DESC, id LIMIT 21 OFFSET :offset")
                .param("user", userId).param("offset", offset).query(Order.class).list();
    }

    void insertOrder(UUID id, UUID businessId, String businessName, String address, UUID providerId, UUID customerId,
                     String customerName, UUID requestKey, String fingerprint, String notes, long total) {
        jdbc.sql("""
            INSERT INTO customer_orders (id, order_reference, business_id, business_name, collection_address,
                customer_id, provider_id, customer_name, request_key, request_fingerprint, notes, total_minor, status)
            VALUES (:id, :reference, :business, :businessName, :address, :customer, :provider, :customerName,
                :key, :fingerprint, :notes, :total, 'PLACED')
            """).param("id", id).param("reference", "KC-" + id).param("business", businessId)
                .param("businessName", businessName).param("address", address).param("customer", customerId)
                .param("provider", providerId).param("customerName", customerName).param("key", requestKey)
                .param("fingerprint", fingerprint).param("notes", notes).param("total", total).update();
    }

    void insertItem(UUID orderId, Item item) {
        jdbc.sql("""
            INSERT INTO customer_order_items (order_id, product_id, product_name, quantity, price_minor, tracked)
            VALUES (:order, :product, :name, :quantity, :price, :tracked)
            """).param("order", orderId).param("product", item.productId()).param("name", item.productName())
                .param("quantity", item.quantity()).param("price", item.priceMinor()).param("tracked", item.tracked()).update();
    }

    List<Item> items(UUID id) {
        return jdbc.sql("SELECT * FROM customer_order_items WHERE order_id = :id ORDER BY product_id")
                .param("id", id).query(Item.class).list();
    }

    void changeStatus(UUID id, Change change) {
        int updated = jdbc.sql("UPDATE customer_orders SET status = :status WHERE id = :id AND status = :previous")
                .param("id", id).param("status", change.status().name()).param("previous", change.expectedStatus().name()).update();
        if (updated != 1) throw ShopService.conflict("This order has changed. Reload it before trying again.");
    }

    void insertEvent(UUID id, UUID actor, Status status) {
        jdbc.sql("INSERT INTO customer_order_status_history (order_id, actor_id, status) VALUES (:id, :actor, :status)")
                .param("id", id).param("actor", actor).param("status", status.name()).update();
    }

    List<Event> history(UUID id) {
        return jdbc.sql("SELECT status, changed_at FROM customer_order_status_history WHERE order_id = :id ORDER BY sequence")
                .param("id", id).query(Event.class).list();
    }
}
