package com.kasicircle.backend.businesses.service;

import com.kasicircle.backend.businesses.dto.CreateBusinessRequest;
import com.kasicircle.backend.businesses.dto.UpdateBusinessRequest;
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
     * Updates an existing business owned by the authenticated user.
     *
     * @param id The UUID of the business to update.
     * @param request The request DTO containing updated business details.
     * @return The response DTO of the updated business.
     */
    BusinessResponse updateBusiness(UUID id, UpdateBusinessRequest request);

    /**
     * Deletes an existing business owned by the authenticated user.
     *
     * @param id The UUID of the business to delete.
     */
    void deleteBusiness(UUID id);

    /**
     * Retrieves a single business by its unique ID.
     *
     * @param id The UUID of the business to retrieve.
     * @return The response DTO of the found business.
     * @throws com.kasicircle.backend.businesses.exception.BusinessNotFoundException if no business is found with the given ID.
     */
    BusinessResponse getBusinessById(UUID id);

    /**
     * Retrieves a paginated list of all businesses, optionally filtered by search keyword, category, and city.
     *
     * @param search Optional keyword matching against business name.
     * @param category Optional category filter.
     * @param city Optional township/city filter.
     * @param pageable The pagination information.
     * @return A page of business response DTOs.
     */
    Page<BusinessResponse> getAllBusinesses(String search, String category, String city, Pageable pageable);

    /**
     * Retrieves a paginated list of all businesses without filters.
     *
     * @param pageable The pagination information.
     * @return A page of business response DTOs.
     */
    default Page<BusinessResponse> getAllBusinesses(Pageable pageable) {
        return getAllBusinesses(null, null, null, pageable);
    }

    /**
     * Retrieves a paginated list of businesses owned by the currently authenticated user.
     *
     * @param pageable The pagination information.
     * @return A page of the current user's business response DTOs.
     */
    Page<BusinessResponse> getBusinessesForCurrentUser(Pageable pageable);
}
