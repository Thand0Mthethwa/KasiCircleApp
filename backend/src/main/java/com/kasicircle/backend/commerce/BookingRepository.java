package com.kasicircle.backend.commerce;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

interface BookingRepository extends JpaRepository<Booking, UUID> {
    Page<Booking> findByCustomerIdOrderByCreatedAtDesc(UUID id, Pageable page);
    Page<Booking> findByProviderOwnerIdOrderByCreatedAtDesc(UUID id, Pageable page);
    Optional<Booking> findByCustomerIdAndRequestKey(UUID customer, UUID requestKey);

    @Query("select b.providerOwnerId from Booking b where b.id = :id and (b.customerId = :actor or b.providerOwnerId = :actor)")
    Optional<UUID> findParticipantProviderId(UUID id, UUID actor);

    @Query("""
        select count(b) > 0 from Booking b where b.customerId = :customer
          and b.serviceId = :service
          and (b.scheduledAt = :start or b.proposedAt = :start)
          and (b.status in ('ACCEPTED', 'IN_PROGRESS')
            or (b.status = 'REQUESTED' and b.scheduledAt > :now)
            or (b.status = 'PROPOSED' and b.proposedAt > :now))
        """)
    boolean hasDuplicate(UUID customer, UUID service, Instant start, Instant now);

    @Query("""
        select count(b) > 0 from Booking b where b.providerOwnerId = :provider and b.id <> :id
          and b.status in ('ACCEPTED', 'IN_PROGRESS')
          and b.scheduledAt < :end and b.endsAt > :start
        """)
    boolean hasOverlap(UUID provider, UUID id, Instant start, Instant end);
}
