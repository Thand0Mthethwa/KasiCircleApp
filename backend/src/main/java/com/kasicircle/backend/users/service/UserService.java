package com.kasicircle.backend.users.service;

import com.kasicircle.backend.users.dto.UserProfileResponse;

/**
 * Service interface for user-related operations.
 */
public interface UserService {

    UserProfileResponse getCurrentUser();

}