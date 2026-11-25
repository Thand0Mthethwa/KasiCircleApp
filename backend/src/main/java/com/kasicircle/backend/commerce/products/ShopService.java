package com.kasicircle.backend.commerce.products;

import com.kasicircle.backend.businesses.domain.Business;
import com.kasicircle.backend.businesses.repository.BusinessImageRepository;
import com.kasicircle.backend.businesses.repository.BusinessRepository;
import com.kasicircle.backend.notifications.domain.NotificationType;
import com.kasicircle.backend.notifications.service.NotificationService;
import com.kasicircle.backend.users.entity.AccountType;
import com.kasicircle.backend.users.entity.Role;
import com.kasicircle.backend.users.entity.User;
import com.kasicircle.backend.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Comparator;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.kasicircle.backend.commerce.products.ShopModels.*;
import static com.kasicircle.backend.commerce.products.ShopModels.Status.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class ShopService {
    private final ShopRepository shop;
    private final BusinessRepository businesses;
    private final BusinessImageRepository images;
    private final UserRepository users;
    private final NotificationService notifications;

    Listing<CatalogItem> catalog(UUID businessId, int page) {
        return Listing.from(shop.products(businessId, true, offset(page)).stream().map(CatalogItem::from).toList());
    }

    Listing<Product> products(String email, int page) {
        Business business = ownedBusiness(user(email));
        return Listing.from(shop.products(business.getId(), false, offset(page)));
    }

    @Transactional
    Product save(String email, UUID id, ProductInput input) {
        User owner = user(email);
        Business business = ownedBusiness(owner);
        UUID businessId = business.getId();
        lockBusiness(businessId);
        boolean create = id == null;
        UUID productId = create ? UUID.randomUUID() : id;
        if (!create) {
            Product current = product(businessId, id);
            if (!Objects.equals(input.revision(), current.revision())) {
                throw conflict("This product has changed. Reload before saving.");
            }
            if ((current.stock() == null) != (input.stock() == null) && shop.hasReservedStock(id)) {
                throw conflict("Stock tracking can change once pending stock reservations are resolved.");
            }
        }
        if (input.imageId() != null && images.findByIdAndBusinessId(input.imageId(), businessId).isEmpty()) {
            throw badRequest("Choose an image from your own business gallery.");
        }
        shop.saveProduct(productId, businessId, input, create);
        return product(businessId, productId);
    }

    Review review(ReviewInput input) {
        List<Line> lines = sortedLines(input.items());
        Business business = businesses.findById(input.businessId()).orElseThrow(() -> missing("Business"));
        return review(business, lines, loadProducts(business.getId(), lines));
    }

    @Transactional
    Detail place(String email, PlaceInput input) {
        User customer = user(email);
        List<Line> lines = sortedLines(input.items());
        String notes = input.notes() == null ? "" : input.notes().trim();
        String fingerprint = fingerprint(input.businessId(), lines, notes);
        shop.lockCustomer(customer.getId());
        Order replay = shop.replay(customer.getId(), input.requestKey()).orElse(null);
        if (replay != null) {
            if (!replay.requestFingerprint().equals(fingerprint)) throw conflict("This request key belongs to a different order.");
            return detail(replay, customer);
        }

        Business business = lockBusiness(input.businessId());
        User provider = business.getOwner();
        if (!provider.isEnabled() || provider.getAccountType() != AccountType.BUSINESS) throw missing("Business");
        if (provider.getId().equals(customer.getId())) throw forbidden("You cannot order from your own business.");
        Map<UUID, Product> products = loadProducts(business.getId(), lines);
        Review review = review(business, lines, products);
        if (!review.ready() || review.collectionAddress().isBlank()) {
            throw conflict("An item or its price has changed. Review your cart again.");
        }
        List<Item> items = lines.stream().map(line -> {
            Product product = products.get(line.productId());
            return new Item(product.id(), product.name(), line.quantity(), product.priceMinor(), product.stock() != null);
        }).toList();

        UUID id = UUID.randomUUID();
        long total = items.stream().mapToLong(Item::total).sum();
        String name = customer.getFirstName() + " " + customer.getLastName();
        shop.insertOrder(id, business.getId(), business.getName(), review.collectionAddress(), provider.getId(),
                customer.getId(), name, input.requestKey(), fingerprint, notes, total);
        for (Item item : items) {
            if (item.tracked()) shop.changeStock(item.productId(), -item.quantity());
            shop.insertItem(id, item);
        }
        shop.insertEvent(id, customer.getId(), PLACED);
        notify(provider.getId(), id, "New collection order", "A customer placed an order with your business.");
        return detail(order(id), customer);
    }

    Listing<Summary> orders(String email, boolean incoming, int page) {
        User user = user(email);
        if (incoming) requireBusiness(user);
        return Listing.from(shop.orders(user.getId(), incoming, offset(page)).stream().map(Summary::from).toList());
    }

    Detail order(String email, UUID id) {
        User user = user(email);
        Order order = order(id);
        if (!participant(order, user) && user.getRole() != Role.ADMIN) throw missing("Order");
        return detail(order, user);
    }

    @Transactional
    Detail change(String email, UUID id, Change change) {
        User actor = user(email);
        Order order = order(id);
        if (!participant(order, actor)) throw missing("Order");
        if (order.businessId() != null) businesses.findForLocationUpdate(order.businessId());
        order = order(id);
        boolean provider = isProvider(order, actor);
        boolean customer = order.customerId().equals(actor.getId());
        if (change.expectedStatus() != order.status()) throw conflict("This order has changed. Reload it before trying again.");
        if (!OrderPolicy.actions(order.status(), provider, customer).contains(change.status())) {
            throw conflict("This action is unavailable for the current order status.");
        }

        shop.changeStatus(id, change);
        if (change.status() == CANCELLED || change.status() == REJECTED) {
            for (Item item : shop.items(id)) {
                if (item.tracked()) shop.changeStock(item.productId(), item.quantity());
            }
        }
        shop.insertEvent(id, actor.getId(), change.status());
        notify(provider ? order.customerId() : order.providerId(), id, "Collection order updated",
                "Open your order to see its latest status.");
        return detail(order(id), actor);
    }

    private Detail detail(Order order, User actor) {
        return new Detail(Summary.from(order), order.collectionAddress(), order.notes(), shop.items(order.id()),
                shop.history(order.id()), OrderPolicy.actions(order.status(), isProvider(order, actor),
                order.customerId().equals(actor.getId())), "OUTSIDE_PLATFORM");
    }

    private Review review(Business business, List<Line> lines, Map<UUID, Product> products) {
        List<ReviewLine> reviewed = lines.stream().map(line -> {
            Product product = products.get(line.productId());
            if (product == null || !product.active()) {
                return new ReviewLine(line.productId(), null, null, line.quantity(), false);
            }
            return new ReviewLine(line.productId(), product.name(), product.priceMinor(),
                    line.quantity(), product.canSupply(line.quantity()));
        }).toList();
        long total = reviewed.stream().filter(ReviewLine::available)
                .mapToLong(line -> (long) line.quantity() * line.priceMinor()).sum();
        boolean ready = reviewed.stream().allMatch(ReviewLine::available) && lines.stream().allMatch(line ->
                products.get(line.productId()).priceMinor() == line.priceMinor());
        String address = String.join(", ", business.getAddress(), business.getCity(), business.getProvince());
        return new Review(business.getName(), address, reviewed, total, ready);
    }

    private Map<UUID, Product> loadProducts(UUID businessId, List<Line> lines) {
        return shop.productsForReview(businessId, lines.stream().map(Line::productId).toList())
                .stream().collect(Collectors.toMap(Product::id, Function.identity()));
    }

    private List<Line> sortedLines(List<Line> lines) {
        HashSet<UUID> seen = new HashSet<>();
        for (Line line : lines) {
            if (!seen.add(line.productId())) throw badRequest("Include each product only once.");
        }
        return lines.stream().sorted(Comparator.comparing(Line::productId)).toList();
    }

    private String fingerprint(UUID business, List<Line> lines, String notes) {
        String payload = business + "|" + lines.stream()
                .map(line -> line.productId() + ":" + line.quantity() + ":" + line.priceMinor())
                .collect(Collectors.joining(",")) + "|" + notes;
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }

    private boolean participant(Order order, User user) {
        return order.customerId().equals(user.getId()) || isProvider(order, user);
    }

    private boolean isProvider(Order order, User user) {
        return user.getAccountType() == AccountType.BUSINESS && order.providerId().equals(user.getId());
    }

    private long offset(int page) {
        if (page < 0) throw badRequest("Page must be zero or higher.");
        return page * 20L;
    }

    private void notify(UUID recipient, UUID order, String title, String message) {
        notifications.createNotification(recipient, NotificationType.ORDER_UPDATE, title, message, "ORDER", order);
    }

    private Business ownedBusiness(User owner) {
        requireBusiness(owner);
        return businesses.findByOwner(owner).orElseThrow(() -> missing("Business profile"));
    }

    private void requireBusiness(User owner) {
        if (owner.getAccountType() != AccountType.BUSINESS) throw forbidden("A business account is required.");
    }

    private Business lockBusiness(UUID id) {
        return businesses.findForLocationUpdate(id).orElseThrow(() -> missing("Business"));
    }

    private Product product(UUID business, UUID id) {
        return shop.product(business, id).orElseThrow(() -> missing("Product"));
    }

    private Order order(UUID id) {
        return shop.order(id).orElseThrow(() -> missing("Order"));
    }

    private User user(String email) {
        return users.findByEmail(email).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sign in to continue."));
    }

    static ResponseStatusException conflict(String message) {
        return new ResponseStatusException(HttpStatus.CONFLICT, message);
    }

    private static ResponseStatusException missing(String resource) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, resource + " not found.");
    }

    private static ResponseStatusException forbidden(String message) {
        return new ResponseStatusException(HttpStatus.FORBIDDEN, message);
    }

    private static ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
