package com.kasicircle.backend.users.controller;

import com.kasicircle.backend.users.dto.UpdateUserProfileRequest;
import com.kasicircle.backend.users.dto.UserProfileResponse;
import com.kasicircle.backend.users.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

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
}