package com.kasicircle.backend.businesses.repository;

import com.kasicircle.backend.businesses.domain.Business;
import com.kasicircle.backend.users.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface BusinessRepository extends JpaRepository<Business, UUID>, JpaSpecificationExecutor<Business> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select b from Business b where b.id = :id")
    Optional<Business> findForLocationUpdate(@org.springframework.data.repository.query.Param("id") UUID id);

    /**
     * Finds a page of businesses owned by a specific user.
     *
     * @param owner The user entity to find businesses for.
     * @param pageable Pagination information.
     * @return A page of businesses owned by the user.
     */
    Page<Business> findByOwner(User owner, Pageable pageable);

    /**
     * Checks if a business owned by the user exists.
     *
     * @param owner The user entity to check.
     * @return true if a business owned by the user exists, false otherwise.
     */
    boolean existsByOwner(User owner);

    /**
     * Finds a business owned by a specific user.
     *
     * @param owner The user entity.
     * @return An Optional containing the business if found.
     */
    Optional<Business> findByOwner(User owner);
}
