package com.kasicircle.backend.auth.service;

import com.kasicircle.backend.auth.dto.AuthenticationResponse;
import com.kasicircle.backend.auth.dto.LoginRequest;
import com.kasicircle.backend.auth.dto.RegisterRequest;
import com.kasicircle.backend.auth.jwt.JwtService;
import com.kasicircle.backend.users.entity.Role;
import com.kasicircle.backend.users.entity.User;
import com.kasicircle.backend.users.exception.UserAlreadyExistsException;
import com.kasicircle.backend.users.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.util.Locale;

@Service
@Validated
public class AuthenticationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthenticationService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public void register(@Valid RegisterRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        userRepository.findByEmail(email).ifPresent(user -> {
            throw new UserAlreadyExistsException("User with email " + email + " already exists");
        });

        User newUser = User.builder()
                .firstName(request.firstName())
                .lastName(request.lastName())
                .email(email)
                .phoneNumber(request.phoneNumber())
                .password(passwordEncoder.encode(request.password()))
                .role(Role.USER) // Default role for new users
                .enabled(true) // Enable user by default
                .build();

        userRepository.save(newUser);
    }

    @Transactional(readOnly = true)
    public AuthenticationResponse login(@Valid LoginRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!user.isEnabled()) {
            throw new DisabledException("User account is disabled");
        }

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        return new AuthenticationResponse(jwtService.generateToken(user));
    }
}
