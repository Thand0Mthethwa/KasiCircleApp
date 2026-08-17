package com.kasicircle.backend.users.controller;

import com.kasicircle.backend.businesses.dto.BusinessResponse;
import com.kasicircle.backend.businesses.service.BusinessService;
import com.kasicircle.backend.users.dto.ChangePasswordRequest;
import com.kasicircle.backend.users.dto.UpdateUserProfileRequest;
import com.kasicircle.backend.users.dto.UserProfileResponse;
import com.kasicircle.backend.users.service.UserService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final BusinessService businessService;

    /**
     * Constructs the UserController with required services.
     * @param userService the user service
     * @param businessService the business service
     */
    public UserController(UserService userService, BusinessService businessService) {
        this.userService = userService;
        this.businessService = businessService;
    }


    /**
     * GET /api/users/me : Get the currently authenticated user's profile.
     *
     * @return the ResponseEntity with status 200 (OK) and the user's profile in body.
     */
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser() {
        UserProfileResponse userProfile = userService.getCurrentUser();
        return ResponseEntity.ok(userProfile);
    }

    /**
     * PUT /api/users/me : Update the currently authenticated user's profile.
     *
     * @param request The request body containing the user profile data to update.
     * @return the ResponseEntity with status 200 (OK) and the updated user's profile in body.
     */
    @PutMapping("/me")
    public ResponseEntity<UserProfileResponse> updateCurrentUser(@Valid @RequestBody UpdateUserProfileRequest request) {
        UserProfileResponse updatedUserProfile = userService.updateCurrentUser(request);
        return ResponseEntity.ok(updatedUserProfile);
    }

    /**
     * PUT /api/users/change-password : Change the currently authenticated user's password.
     *
     * @param request The request body containing the current and new passwords.
     * @return the ResponseEntity with status 200 (OK).
     */
    @PutMapping("/change-password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(request);
        return ResponseEntity.ok().build();
    }

    /**
     * GET /api/users/me/businesses : Retrieves all businesses owned by the currently authenticated user.
     *
     * @param pageable Pagination and sorting information.
     * @return ResponseEntity containing a Page of the user's BusinessResponse DTOs.
     */
    @GetMapping("/me/businesses")
    public ResponseEntity<Page<BusinessResponse>> getBusinessesForCurrentUser(
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<BusinessResponse> response = businessService.getBusinessesForCurrentUser(pageable);
        return ResponseEntity.ok(response);
    }
}
