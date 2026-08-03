package com.kasicircle.backend.users.service;

import com.kasicircle.backend.users.dto.ChangePasswordRequest;
import com.kasicircle.backend.users.dto.UpdateUserProfileRequest;
import com.kasicircle.backend.users.dto.UserProfileResponse;
import com.kasicircle.backend.users.entity.User;
import com.kasicircle.backend.users.exception.UserNotFoundException;
import com.kasicircle.backend.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service implementation for user-related business logic.
 *
 * <p>Responsibilities:
 * <ul>
 *     <li>Retrieving and updating user profiles.</li>
 *     <li>Handling password change operations.</li>
 *     <li>Interacting with the {@link UserRepository} for data persistence.</li>
 * </ul>
 *
 * Layer: Service
 * @author KasiCircle Team
 * @since 1.0
 */
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Retrieves the profile of the currently authenticated user from the security context.
     * This operation is read-only to optimize for performance, as it does not
     * require a write lock on the user data.
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
     * Updates the profile of the currently authenticated user with the provided details.
     * This operation is transactional, ensuring that all changes are saved
     * successfully or none at all.
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

    /**
     * Changes the password for the currently authenticated user.
     * <p>
     * This method performs several validation checks:
     * 1. Verifies that the provided current password is correct.
     * 2. Ensures the new password and its confirmation match.
     * 3. Prevents the new password from being the same as the old one.
     *
     * @param request DTO containing the current, new, and confirmation passwords.
     * @throws BadCredentialsException if any of the validation checks fail.
     */
    @Override
    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        User user = getAuthenticatedUser();

        // 1. Verify current password
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new BadCredentialsException("Incorrect current password.");
        }

        // 2. Verify new password equals confirm password
        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new BadCredentialsException("New password and confirmation password do not match.");
        }

        // 3. Reject if new password equals current password
        if (passwordEncoder.matches(request.newPassword(), user.getPassword())) {
            throw new BadCredentialsException("New password cannot be the same as the old password.");
        }

        // 4. Encode new password and save user
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    /**
     * Retrieves the full {@link User} entity for the currently authenticated user.
     * It uses the email from the security principal to fetch the user from the repository.
     *
     * @return The authenticated {@link User} entity.
     * @throws UserNotFoundException if no user corresponds to the authenticated principal's email.
     */
    private User getAuthenticatedUser() {
        String email = getAuthenticatedUserEmail();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User with email " + email + " not found"));
    }

    /**
     * Extracts the username (email) from the Spring Security context.
     * The principal is expected to be an instance of {@link UserDetails}.
     *
     * @return The email of the currently authenticated user.
     * @throws IllegalStateException if the security principal is not of the expected type.
     */
    private String getAuthenticatedUserEmail() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetails) {
            return ((UserDetails) principal).getUsername();
        }
        return principal.toString();
    }

    /**
     * Maps a {@link User} entity to a {@link UserProfileResponse} DTO.
     * This prevents exposing sensitive entity fields to the client.
     *
     * @param user The user entity to map.
     * @return A {@link UserProfileResponse} DTO containing public user data.
     */
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