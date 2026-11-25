package com.kasicircle.backend.commerce;

import com.kasicircle.backend.businesses.domain.Business;
import com.kasicircle.backend.businesses.repository.BusinessRepository;
import com.kasicircle.backend.notifications.domain.NotificationType;
import com.kasicircle.backend.notifications.service.NotificationService;
import com.kasicircle.backend.users.entity.AccountType;
import com.kasicircle.backend.users.entity.Role;
import com.kasicircle.backend.users.entity.User;
import com.kasicircle.backend.users.repository.UserRepository;
import com.kasicircle.backend.workers.domain.WorkerProfile;
import com.kasicircle.backend.workers.repository.WorkerProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static com.kasicircle.backend.commerce.CommerceDtos.*;
import static com.kasicircle.backend.commerce.ServiceOffering.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class CommerceService {
    private final ServiceOfferingRepository offerings;
    private final BookingRepository bookings;
    private final BusinessRepository businesses;
    private final WorkerProfileRepository workers;
    private final UserRepository users;
    private final NotificationService notifications;
    private final JdbcTemplate jdbc;

    Page<Offering> list(ProviderType type, UUID providerId, Pageable page) {
        return (type == ProviderType.BUSINESS
                ? offerings.findByBusinessIdAndActiveTrueOrderByCreatedAtDesc(providerId, page)
                : offerings.findByWorkerIdAndActiveTrueOrderByCreatedAtDesc(providerId, page)).map(Offering::from);
    }

    Offering getOffering(UUID id) {
        ServiceOffering offering = findOffering(id);
        if (!isListed(offering)) throw missing("Service");
        return Offering.from(offering);
    }

    Page<Offering> mine(String email, Pageable page) {
        User owner = user(email);
        Provider provider = provider(owner);
        return (provider.type == ProviderType.BUSINESS
                ? offerings.findByProviderOwnerIdAndBusinessIdOrderByCreatedAtDesc(owner.getId(), provider.id, page)
                : offerings.findByProviderOwnerIdAndWorkerIdOrderByCreatedAtDesc(owner.getId(), provider.id, page))
                .map(Offering::from);
    }

    @Transactional
    Offering saveOffering(String email, UUID id, ServiceInput request) {
        User owner = user(email);
        lock("provider", owner.getId());
        Provider provider = provider(owner);
        ServiceOffering offering;
        if (id == null) {
            offering = new ServiceOffering();
            offering.id = UUID.randomUUID();
            offering.providerOwnerId = owner.getId();
            offering.providerType = provider.type;
            offering.createdAt = Instant.now();
            if (provider.type == ProviderType.BUSINESS) offering.businessId = provider.id;
            else offering.workerId = provider.id;
        } else {
            offering = ownedOffering(id, owner, provider);
        }

        if ((request.priceModel() == PriceModel.QUOTE) != (request.price() == null)) {
            throw error(HttpStatus.BAD_REQUEST, "Enter a price for fixed or starting prices only.");
        }
        String category = request.category() == null ? "" : request.category().trim();
        if (category.isEmpty() && provider.categories.size() == 1) category = provider.categories.getFirst();
        String selected = category;
        offering.category = provider.categories.stream().filter(value -> value.equalsIgnoreCase(selected))
                .findFirst().orElseThrow(() -> error(HttpStatus.BAD_REQUEST, "Choose a category from your provider profile."));
        offering.name = request.name().trim();
        offering.description = request.description().trim();
        offering.priceModel = request.priceModel();
        offering.price = request.price();
        offering.durationMinutes = request.durationMinutes();
        offering.active = request.active();
        offering.updatedAt = Instant.now();
        return Offering.from(offerings.save(offering));
    }

    @Transactional
    void deactivate(String email, UUID id) {
        User owner = user(email);
        lock("provider", owner.getId());
        ServiceOffering offering = ownedOffering(id, owner, provider(owner));
        offering.active = false;
        offering.updatedAt = Instant.now();
    }

    @Transactional
    BookingView request(String email, BookingInput input) {
        User customer = user(email);
        UUID customerId = customer.getId();
        lock("customer", customerId);
        Booking previous = bookings.findByCustomerIdAndRequestKey(customerId, input.requestKey()).orElse(null);
        if (previous != null) {
            if (!previous.serviceId.equals(input.serviceId())
                    || !previous.requestedAt.equals(input.preferredAt().truncatedTo(ChronoUnit.MICROS))
                    || !previous.workDescription.equals(input.workDescription().trim())
                    || !previous.serviceArea.equals(input.serviceArea().trim())) {
                throw error(HttpStatus.CONFLICT, "This request key was already used for a different booking request.");
            }
            return view(previous, customer, Instant.now());
        }

        UUID providerId = offerings.findProviderId(input.serviceId()).orElseThrow(() -> missing("Service"));
        lock("provider", providerId);
        ServiceOffering offering = offerings.findForUpdate(input.serviceId()).orElseThrow(() -> missing("Service"));
        if (!isListed(offering)) throw missing("Service");
        if (providerId.equals(customerId)) throw error(HttpStatus.FORBIDDEN, "You cannot book your own service.");

        User owner = users.findById(providerId).orElseThrow(() -> missing("Provider"));
        Provider provider = provider(owner);
        if (!owner.isEnabled() || !matches(offering, provider)) throw missing("Service");
        Instant now = Instant.now();
        Instant preferred = BookingPolicy.futureSlot(input.preferredAt(), now);
        if (bookings.hasDuplicate(customerId, offering.id, preferred, now)) {
            throw error(HttpStatus.CONFLICT, "You already have an open request for this service at that time.");
        }

        Booking booking = new Booking();
        booking.id = UUID.randomUUID();
        booking.requestKey = input.requestKey();
        booking.customerId = customerId;
        booking.providerOwnerId = providerId;
        booking.serviceId = offering.id;
        booking.serviceName = offering.name;
        booking.providerName = provider.name;
        booking.customerName = displayName(customer);
        booking.workDescription = input.workDescription().trim();
        booking.serviceArea = input.serviceArea().trim();
        booking.durationMinutes = offering.durationMinutes;
        booking.priceModel = offering.priceModel;
        booking.agreedPrice = offering.priceModel == PriceModel.FIXED ? offering.price : null;
        booking.status = Booking.Status.REQUESTED;
        booking.requestedAt = preferred;
        booking.schedule(preferred);
        booking.createdAt = now;
        booking.updatedAt = now;

        booking = bookings.saveAndFlush(booking);
        notify(providerId, booking, "New booking request", "A customer requested one of your services.");
        return view(booking, customer, now);
    }

    Page<BookingView> listBookings(String email, boolean incoming, Pageable page) {
        User viewer = user(email);
        if (incoming && viewer.getAccountType() != AccountType.BUSINESS && viewer.getAccountType() != AccountType.WORKER) {
            throw error(HttpStatus.FORBIDDEN, "Only business owners and workers can view incoming bookings.");
        }
        Instant now = Instant.now();
        return (incoming ? bookings.findByProviderOwnerIdOrderByCreatedAtDesc(viewer.getId(), page)
                : bookings.findByCustomerIdOrderByCreatedAtDesc(viewer.getId(), page)).map(booking -> view(booking, viewer, now));
    }

    BookingView getBooking(String email, UUID id) {
        User viewer = user(email);
        Booking booking = findBooking(id);
        if (!booking.providerOwnerId.equals(viewer.getId()) && !booking.customerId.equals(viewer.getId())
                && viewer.getRole() != Role.ADMIN) throw missing("Booking");
        return view(booking, viewer, Instant.now());
    }

    @Transactional
    BookingView updateBooking(String email, UUID id, Change request) {
        User actor = user(email);
        UUID providerId = bookings.findParticipantProviderId(id, actor.getId()).orElseThrow(() -> missing("Booking"));
        lock("provider", providerId);
        Booking booking = findBooking(id);
        if (!request.revision().equals(booking.revision)) {
            throw error(HttpStatus.CONFLICT, "This booking has changed. Reload it before trying again.");
        }
        Instant now = Instant.now().truncatedTo(ChronoUnit.MICROS);
        boolean provider = providerId.equals(actor.getId());
        if (provider && actor.getAccountType() != AccountType.BUSINESS && actor.getAccountType() != AccountType.WORKER) {
            throw error(HttpStatus.FORBIDDEN, "Only the service provider can manage this booking.");
        }
        boolean confirms = BookingPolicy.change(booking, request, provider, now);
        booking.updatedAt = now;
        if (confirms && bookings.hasOverlap(providerId, id, booking.scheduledAt, booking.endsAt)) {
            throw error(HttpStatus.CONFLICT, "The provider already has a confirmed booking during this time.");
        }
        bookings.flush();
        notify(provider ? booking.customerId : providerId, booking, "Booking updated",
                "Open your booking to see the latest status.");
        return view(booking, actor, now);
    }

    private void lock(String scope, UUID id) {
        // Hold a provider lock through commit so concurrent confirmations see the latest bookings.
        jdbc.query("select pg_advisory_xact_lock(hashtextextended(?, 0))", rs -> {}, scope + ":" + id);
    }

    private void notify(UUID recipient, Booking booking, String title, String message) {
        notifications.createNotification(recipient, NotificationType.BOOKING_UPDATE, title, message, "BOOKING", booking.id);
    }

    private BookingView view(Booking booking, User viewer, Instant now) {
        String side = "ADMIN";
        if (booking.customerId.equals(viewer.getId())) side = "CUSTOMER";
        if (booking.providerOwnerId.equals(viewer.getId())) side = "PROVIDER";
        return new BookingView(booking.id, booking.serviceId, booking.serviceName, booking.providerName,
                booking.customerName, booking.workDescription, booking.serviceArea, booking.durationMinutes,
                booking.scheduledAt, booking.endsAt, booking.priceModel, booking.agreedPrice, booking.proposedAt,
                booking.proposedPrice, booking.visibleStatus(now), "OUTSIDE_PLATFORM", side, booking.revision,
                booking.createdAt, booking.updatedAt);
    }

    private ServiceOffering ownedOffering(UUID id, User owner, Provider provider) {
        ServiceOffering offering = offerings.findForUpdate(id).orElseThrow(() -> missing("Service"));
        if (!offering.providerOwnerId.equals(owner.getId()) || !matches(offering, provider)) throw missing("Service");
        return offering;
    }

    private boolean matches(ServiceOffering offering, Provider provider) {
        return offering.providerType == provider.type
                && provider.id.equals(provider.type == ProviderType.BUSINESS ? offering.businessId : offering.workerId);
    }

    private boolean isListed(ServiceOffering offering) {
        return offering.active && (offering.businessId != null || offering.workerId != null);
    }

    private ServiceOffering findOffering(UUID id) {
        return offerings.findById(id).orElseThrow(() -> missing("Service"));
    }

    private Booking findBooking(UUID id) {
        return bookings.findById(id).orElseThrow(() -> missing("Booking"));
    }

    private Provider provider(User user) {
        if (user.getAccountType() == AccountType.BUSINESS) {
            Business business = businesses.findByOwner(user).orElseThrow(() -> missing("Business profile"));
            return new Provider(ProviderType.BUSINESS, business.getId(), business.getName(), List.of(business.getCategory()));
        }
        if (user.getAccountType() == AccountType.WORKER) {
            WorkerProfile worker = workers.findByOwnerId(user.getId()).orElseThrow(() -> missing("Worker profile"));
            return new Provider(ProviderType.WORKER, worker.getId(), displayName(user), List.copyOf(worker.getServiceCategories()));
        }
        throw error(HttpStatus.FORBIDDEN, "Only business owners and workers can manage service listings.");
    }

    private String displayName(User user) {
        return user.getFirstName() + " " + user.getLastName();
    }

    private User user(String email) {
        return users.findByEmail(email).orElseThrow(() -> error(HttpStatus.UNAUTHORIZED, "Sign in to continue."));
    }

    private ResponseStatusException missing(String resource) {
        return error(HttpStatus.NOT_FOUND, resource + " not found.");
    }

    private ResponseStatusException error(HttpStatus status, String message) {
        return new ResponseStatusException(status, message);
    }

    private record Provider(ProviderType type, UUID id, String name, List<String> categories) {}
}
