package com.kasicircle.backend.users.service.impl;

import com.kasicircle.backend.auth.dto.RegisterRequest;
import com.kasicircle.backend.users.dto.UserResponse;
import com.kasicircle.backend.users.entity.User;
import com.kasicircle.backend.users.exception.UserAlreadyExistsException;
import com.kasicircle.backend.users.exception.UserNotFoundException;
import com.kasicircle.backend.users.mapper.UserMapper;
import com.kasicircle.backend.users.repository.UserRepository;
import com.kasicircle.backend.users.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserResponse getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String username;

        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else {
            username = principal.toString();
        }

        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + username));

        return UserMapper.toUserResponse(user);
    }

    @Override
    @Transactional
    public void createUser(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new UserAlreadyExistsException("User with email " + request.email() + " already exists");
        }

        User user = new User();
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setEmail(request.email());
        user.setPhoneNumber(request.phoneNumber());
        user.setPassword(passwordEncoder.encode(request.password()));
        
        userRepository.save(user);
    }
}
