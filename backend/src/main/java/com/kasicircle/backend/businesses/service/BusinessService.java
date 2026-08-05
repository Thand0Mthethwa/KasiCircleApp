package com.kasicircle.backend.businesses.service;

import com.kasicircle.backend.businesses.dto.CreateBusinessRequest;
import com.kasicircle.backend.businesses.dto.BusinessResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * Service interface for managing business profiles.
 */
public interface BusinessService {
    /**
     * Creates a new business profile for the authenticated user.
     *
     * @param request The request DTO containing business details.
     * @return The response DTO of the newly created business.
     */
    BusinessResponse createBusiness(CreateBusinessRequest request);

    /**
     * Retrieves a single business by its unique ID.
     *
     * @param id The UUID of the business to retrieve.
     * @return The response DTO of the found business.
     * @throws com.kasicircle.backend.businesses.exception.BusinessNotFoundException if no business is found with the given ID.
     */
    BusinessResponse getBusinessById(UUID id);

    /**
     * Retrieves a paginated list of all businesses.
     *
     * @param pageable The pagination information.
     * @return A page of business response DTOs.
     */
    Page<BusinessResponse> getAllBusinesses(Pageable pageable);

    /**
     * Retrieves a paginated list of businesses owned by the currently authenticated user.
     *
     * @param pageable The pagination information.
     * @return A page of the current user's business response DTOs.
     */
    Page<BusinessResponse> getBusinessesForCurrentUser(Pageable pageable);
}
