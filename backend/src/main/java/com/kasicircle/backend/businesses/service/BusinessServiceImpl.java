package com.kasicircle.backend.businesses.service;

import com.kasicircle.backend.businesses.domain.Business;
import com.kasicircle.backend.businesses.dto.CreateBusinessRequest;
import com.kasicircle.backend.businesses.dto.UpdateBusinessRequest;
import com.kasicircle.backend.businesses.dto.BusinessResponse;
import com.kasicircle.backend.businesses.mapper.BusinessMapper;
import com.kasicircle.backend.businesses.repository.BusinessRepository;
import com.kasicircle.backend.businesses.exception.BusinessNotFoundException;
import com.kasicircle.backend.users.entity.User;
import com.kasicircle.backend.users.exception.UserNotFoundException;
import com.kasicircle.backend.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BusinessServiceImpl implements BusinessService {

    private final BusinessRepository businessRepository;
    private final UserRepository userRepository;
    private final BusinessMapper businessMapper;

    @Override
    @Transactional
    public BusinessResponse createBusiness(CreateBusinessRequest request) {
        User owner = getAuthenticatedUser();

        Business business = Business.builder()
                .name(request.name())
                .description(request.description())
                .phoneNumber(request.phoneNumber())
                .email(request.email())
                .category(request.category())
                .address(request.address())
                .city(request.city())
                .province(request.province())
                .owner(owner)
                .build();

        Business savedBusiness = businessRepository.save(business);

        return businessMapper.toBusinessResponse(savedBusiness);
    }

    @Override
    @Transactional(readOnly = true)
    public BusinessResponse getBusinessById(UUID id) {
        return businessRepository.findById(id)
                .map(businessMapper::toBusinessResponse)
                .orElseThrow(() -> new BusinessNotFoundException("Business with ID " + id + " not found."));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BusinessResponse> getAllBusinesses(Pageable pageable) {
        return businessRepository.findAll(pageable)
                .map(businessMapper::toBusinessResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BusinessResponse> getBusinessesForCurrentUser(Pageable pageable) {
        User owner = getAuthenticatedUser();
        return businessRepository.findByOwner(owner, pageable)
                .map(businessMapper::toBusinessResponse);
    }

    @Override
    @Transactional
    public BusinessResponse updateBusiness(UUID id, UpdateBusinessRequest request) {
        User owner = getAuthenticatedUser();
        Business business = getBusinessByIdInternal(id);
        verifyOwnership(business, owner);

        business.setName(request.name());
        business.setDescription(request.description());
        business.setPhoneNumber(request.phoneNumber());
        business.setEmail(request.email());
        business.setCategory(request.category());
        business.setAddress(request.address());
        business.setCity(request.city());
        business.setProvince(request.province());

        Business updatedBusiness = businessRepository.save(business);
        return businessMapper.toBusinessResponse(updatedBusiness);
    }

    @Override
    @Transactional
    public void deleteBusiness(UUID id) {
        User owner = getAuthenticatedUser();
        Business business = getBusinessByIdInternal(id);
        verifyOwnership(business, owner);
        businessRepository.delete(business);
    }

    private Business getBusinessByIdInternal(UUID id) {
        return businessRepository.findById(id)
                .orElseThrow(() -> new BusinessNotFoundException("Business with ID " + id + " not found."));
    }

    private void verifyOwnership(Business business, User owner) {
        if (business.getOwner() == null || business.getOwner().getId() == null || owner.getId() == null ||
                !business.getOwner().getId().equals(owner.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not authorized to modify this business.");
        }
    }

    private User getAuthenticatedUser() {
        String email = getAuthenticatedUserEmail();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User with email " + email + " not found"));
    }

    private String getAuthenticatedUserEmail() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetails) {
            return ((UserDetails) principal).getUsername();
        }
        return principal.toString();
    }
}

