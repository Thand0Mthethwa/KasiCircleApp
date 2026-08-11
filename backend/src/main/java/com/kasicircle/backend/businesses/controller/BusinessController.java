package com.kasicircle.backend.businesses.controller;

import com.kasicircle.backend.businesses.dto.CreateBusinessRequest;
import com.kasicircle.backend.businesses.dto.UpdateBusinessRequest;
import com.kasicircle.backend.businesses.dto.BusinessResponse;
import com.kasicircle.backend.businesses.service.BusinessService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/businesses")
@RequiredArgsConstructor
public class BusinessController {

    private final BusinessService businessService;

    @PostMapping
    public ResponseEntity<BusinessResponse> createBusiness(@Valid @RequestBody CreateBusinessRequest request) {
        BusinessResponse response = businessService.createBusiness(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * Retrieves a single business by its ID.
     *
     * @param id The UUID of the business.
     * @return ResponseEntity containing the BusinessResponse and HTTP status 200 OK.
     */
    @GetMapping("/{id}")
    public ResponseEntity<BusinessResponse> getBusinessById(@PathVariable UUID id) {
        BusinessResponse response = businessService.getBusinessById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieves a paginated list of all businesses.
     * Supports pagination and sorting. Defaults to sorting by creation date descending.
     *
     * @param pageable Pagination and sorting information.
     * @return ResponseEntity containing a Page of BusinessResponse.
     */
    @GetMapping
    public ResponseEntity<Page<BusinessResponse>> getAllBusinesses(
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<BusinessResponse> response = businessService.getAllBusinesses(pageable);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BusinessResponse> updateBusiness(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateBusinessRequest request
    ) {
        BusinessResponse response = businessService.updateBusiness(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBusiness(@PathVariable UUID id) {
        businessService.deleteBusiness(id);
        return ResponseEntity.noContent().build();
    }
}
