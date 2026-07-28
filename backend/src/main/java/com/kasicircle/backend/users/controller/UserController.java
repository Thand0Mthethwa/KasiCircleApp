package com.kasicircle.backend.users.controller;

import com.kasicircle.backend.users.dto.UserProfileResponse;
import com.kasicircle.backend.users.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
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
}