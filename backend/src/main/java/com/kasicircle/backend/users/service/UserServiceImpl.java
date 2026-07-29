package com.kasicircle.backend.users.service;

import com.kasicircle.backend.users.dto.UpdateUserProfileRequest;
import com.kasicircle.backend.users.dto.UserProfileResponse;
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
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    /**
     * Retrieves the profile of the currently authenticated user.
     *
     * @return UserProfileResponse containing the user's details.
     * @throws UserNotFoundException if the user cannot be found in the database.
     */
    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUser() {
        User user = getAuthenticatedUser();
        return mapUserToUserProfileResponse(user);
    }

    /**
     * Updates the profile of the currently authenticated user.
     *
     * @param request DTO containing the fields to update.
     * @return UserProfileResponse containing the updated user's details.
     * @throws UserNotFoundException if the user cannot be found in the database.
     */
    @Override
    @Transactional
    public UserProfileResponse updateCurrentUser(UpdateUserProfileRequest request) {
        User user = getAuthenticatedUser();

        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setPhoneNumber(request.phoneNumber());

        User updatedUser = userRepository.save(user);

        return mapUserToUserProfileResponse(updatedUser);
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