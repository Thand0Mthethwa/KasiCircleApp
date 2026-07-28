package com.kasicircle.backend.users.service;

import com.kasicircle.backend.users.dto.UserProfileResponse;
import com.kasicircle.backend.users.entity.User;
import com.kasicircle.backend.users.exception.UserNotFoundException;
import com.kasicircle.backend.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    /**
     * Retrieves the profile of the currently authenticated user.
     *
     * @return UserProfileResponse containing the user's details.
     * @throws UserNotFoundException if the user cannot be found in the database.
     */
    @Override
    public UserProfileResponse getCurrentUser() {
        String email = getAuthenticatedUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User with email " + email + " not found"));

        return mapUserToUserProfileResponse(user);
    }

    private String getAuthenticatedUserEmail() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetails) {
            return ((UserDetails) principal).getUsername();
        }
        return principal.toString();
    }

    private UserProfileResponse mapUserToUserProfileResponse(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole())
                .build();
    }
}