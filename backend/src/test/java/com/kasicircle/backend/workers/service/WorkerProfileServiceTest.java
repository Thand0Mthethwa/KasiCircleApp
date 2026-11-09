package com.kasicircle.backend.workers.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kasicircle.backend.users.entity.AccountType;
import com.kasicircle.backend.users.repository.UserRepository;
import com.kasicircle.backend.workers.domain.WorkerProfile;
import com.kasicircle.backend.workers.dto.WorkerProfileRequest;
import com.kasicircle.backend.workers.dto.WorkerProfileResponse;
import com.kasicircle.backend.workers.exception.WorkerProfileNotFoundException;
import com.kasicircle.backend.workers.repository.WorkerProfileRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WorkerProfileServiceTest {

    @Mock
    private WorkerProfileRepository workerProfileRepository;

    @Mock
    private UserRepository userRepository;

    private WorkerProfileServiceImpl service;
    private final UUID ownerId = UUID.randomUUID();
    private com.kasicircle.backend.users.entity.User worker;

    @BeforeEach
    void setUp() {
        service = new WorkerProfileServiceImpl(workerProfileRepository, userRepository);
        worker = com.kasicircle.backend.users.entity.User.builder()
                .id(ownerId)
                .firstName("Amahle")
                .lastName("Dube")
                .email("worker@example.com")
                .accountType(AccountType.WORKER)
                .build();
        UserDetails principal = org.springframework.security.core.userdetails.User
                .withUsername(worker.getEmail()).password("unused").roles("USER").build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createProfileRequiresWorkerAccountAndNormalizesUserFields() throws Exception {
        stubCurrentWorker();
        when(workerProfileRepository.existsByOwnerId(ownerId)).thenReturn(false);
        when(workerProfileRepository.save(any(WorkerProfile.class))).thenAnswer(invocation -> {
            WorkerProfile profile = invocation.getArgument(0);
            profile.setId(UUID.randomUUID());
            return profile;
        });

        WorkerProfileResponse response = service.createMyProfile(request());

        assertEquals("Amahle Dube", response.displayName());
        assertEquals("Qualified Electrician", response.headline());
        assertEquals(Set.of("Electrical repair", "Wiring"), response.skills());
        assertEquals(Set.of("Electrical"), response.serviceCategories());
        assertEquals(ownerId, response.ownerId());
        String publicJson = new ObjectMapper().writeValueAsString(response);
        org.junit.jupiter.api.Assertions.assertFalse(publicJson.contains("worker@example.com"));
        org.junit.jupiter.api.Assertions.assertFalse(publicJson.contains("phoneNumber"));
    }

    @Test
    void duplicateWorkerProfileReturnsConflict() {
        stubCurrentWorker();
        when(workerProfileRepository.existsByOwnerId(ownerId)).thenReturn(true);

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class, () -> service.createMyProfile(request()));

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        verify(workerProfileRepository, never()).save(any());
    }

    @Test
    void nonWorkerCannotManageWorkerProfile() {
        when(userRepository.findByEmail(worker.getEmail())).thenReturn(Optional.of(worker));
        worker.setAccountType(AccountType.RESIDENT);

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class, () -> service.createMyProfile(request()));

        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
        verify(workerProfileRepository, never()).existsByOwnerId(any());
    }

    @Test
    void missingOwnProfileReturnsNotFound() {
        stubCurrentWorker();
        when(workerProfileRepository.findByOwnerId(ownerId)).thenReturn(Optional.empty());

        assertThrows(WorkerProfileNotFoundException.class, service::getMyProfile);
    }

    @Test
    void updateProfileChangesOnlyTheAuthenticatedWorkersProfile() {
        stubCurrentWorker();
        WorkerProfile profile = profile();
        when(workerProfileRepository.findByOwnerId(ownerId)).thenReturn(Optional.of(profile));
        when(workerProfileRepository.save(profile)).thenReturn(profile);

        WorkerProfileResponse response = service.updateMyProfile(request());

        assertEquals("Qualified Electrician", response.headline());
        assertEquals("Soweto", response.city());
        verify(workerProfileRepository).findByOwnerId(ownerId);
        verify(workerProfileRepository).save(profile);
    }

    @Test
    void publicSearchNormalizesFiltersAndMapsProfiles() {
        WorkerProfile profile = profile();
        when(workerProfileRepository.searchPublicProfiles("electrician", "electrical", "wiring", "soweto",
                PageRequest.of(0, 10))).thenReturn(new PageImpl<>(List.of(profile)));

        var result = service.searchPublicProfiles(" Electrician ", "Electrical ", " Wiring", " Soweto ", PageRequest.of(0, 10));

        assertEquals(1, result.getTotalElements());
        assertEquals("Amahle Dube", result.getContent().get(0).displayName());
        verify(workerProfileRepository).searchPublicProfiles("electrician", "electrical", "wiring", "soweto",
                PageRequest.of(0, 10));
    }

    private WorkerProfile profile() {
        WorkerProfile profile = new WorkerProfile();
        profile.setId(UUID.randomUUID());
        profile.setOwner(worker);
        profile.setHeadline("Qualified Electrician");
        profile.setBio("Residential wiring and repairs");
        profile.setSkills(Set.of("Wiring"));
        profile.setServiceCategories(Set.of("Electrical"));
        profile.setCity("Soweto");
        profile.setProvince("Gauteng");
        return profile;
    }

    private WorkerProfileRequest request() {
        return new WorkerProfileRequest(
                " Qualified Electrician ",
                " Residential wiring and repairs ",
                Set.of(" Wiring ", "Electrical repair"),
                Set.of("Electrical"),
                " Soweto ",
                " Gauteng "
        );
    }

    private void stubCurrentWorker() {
        when(userRepository.findByEmail(worker.getEmail())).thenReturn(Optional.of(worker));
    }
}
