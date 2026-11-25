package com.kasicircle.backend.commerce;

import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import java.util.Optional;
import java.util.UUID;

interface ServiceOfferingRepository extends JpaRepository<ServiceOffering, UUID> {
    Page<ServiceOffering> findByBusinessIdAndActiveTrueOrderByCreatedAtDesc(UUID id, Pageable page);
    Page<ServiceOffering> findByWorkerIdAndActiveTrueOrderByCreatedAtDesc(UUID id, Pageable page);
    Page<ServiceOffering> findByProviderOwnerIdAndBusinessIdOrderByCreatedAtDesc(UUID owner, UUID business, Pageable page);
    Page<ServiceOffering> findByProviderOwnerIdAndWorkerIdOrderByCreatedAtDesc(UUID owner, UUID worker, Pageable page);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from ServiceOffering s where s.id = :id")
    Optional<ServiceOffering> findForUpdate(UUID id);

    @Query("select s.providerOwnerId from ServiceOffering s where s.id = :id")
    Optional<UUID> findProviderId(UUID id);
}
