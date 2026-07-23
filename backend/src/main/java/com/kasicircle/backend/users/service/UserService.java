package com.kasicircle.backend.users.service;

import com.kasicircle.backend.auth.dto.RegisterRequest;
import com.kasicircle.backend.users.dto.UserResponse;

public interface UserService {
    UserResponse getCurrentUser();
    void createUser(RegisterRequest request);
}
