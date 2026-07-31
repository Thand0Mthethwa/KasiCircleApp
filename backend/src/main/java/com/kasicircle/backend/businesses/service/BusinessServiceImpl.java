package com.kasicircle.backend.businesses.service;

import com.kasicircle.backend.businesses.domain.Business;
import com.kasicircle.backend.businesses.dto.CreateBusinessRequest;
import com.kasicircle.backend.businesses.dto.BusinessResponse;
import com.kasicircle.backend.businesses.mapper.BusinessMapper;
import com.kasicircle.backend.businesses.repository.BusinessRepository;
import com.kasicircle.backend.users.entity.User;
import com.kasicircle.backend.users.exception.UserNotFoundException;
import com.kasicircle.backend.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
