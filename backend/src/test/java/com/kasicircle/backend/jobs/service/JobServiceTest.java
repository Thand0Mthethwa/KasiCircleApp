package com.kasicircle.backend.jobs.service;

import com.kasicircle.backend.jobs.domain.EmploymentType;
import com.kasicircle.backend.jobs.domain.Job;
import com.kasicircle.backend.jobs.domain.JobStatus;
import com.kasicircle.backend.jobs.dto.JobRequest;
import com.kasicircle.backend.jobs.dto.JobResponse;
import com.kasicircle.backend.jobs.exception.JobNotFoundException;
import com.kasicircle.backend.jobs.repository.JobRepository;
import com.kasicircle.backend.users.entity.User;
import com.kasicircle.backend.users.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JobServiceTest {

    @Mock
    private JobRepository jobRepository;

    @Mock
    private UserRepository userRepository;

    private JobServiceImpl service;
    private User employer;
    private Job job;
    private final UUID jobId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        service = new JobServiceImpl(jobRepository, userRepository);
        employer = User.builder().id(UUID.randomUUID()).firstName("Thando").lastName("Mokoena")
                .email("employer@example.com").build();
        authenticate(employer.getEmail());
    }

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createsJobForAuthenticatedEmployerWithOpenStatus() {
        when(userRepository.findByEmail(employer.getEmail())).thenReturn(Optional.of(employer));
        when(jobRepository.save(any(Job.class))).thenAnswer(invocation -> {
            Job saved = invocation.getArgument(0);
            saved.setId(jobId);
            return saved;
        });

        JobResponse result = service.createJob(request());

        assertEquals(jobId, result.id());
        assertEquals(JobStatus.OPEN, result.status());
        assertEquals("Thando Mokoena", result.employerName());
        assertEquals(EmploymentType.FULL_TIME, result.employmentType());
    }

    @Test
    void onlyOwnerMayEditOrCloseJob() {
        User otherUser = User.builder().id(UUID.randomUUID()).email("other@example.com").build();
        when(userRepository.findByEmail(otherUser.getEmail())).thenReturn(Optional.of(otherUser));
        authenticate(otherUser.getEmail());
        when(jobRepository.findById(jobId)).thenReturn(Optional.of(job()));

        ResponseStatusException editError = assertThrows(
                ResponseStatusException.class, () -> service.updateJob(jobId, request()));
        assertEquals(HttpStatus.FORBIDDEN, editError.getStatusCode());

        ResponseStatusException closeError = assertThrows(
                ResponseStatusException.class, () -> service.updateJobStatus(jobId, JobStatus.CLOSED));
        assertEquals(HttpStatus.FORBIDDEN, closeError.getStatusCode());
    }

    @Test
    void closedJobsCannotBeEdited() {
        job = job();
        job.setStatus(JobStatus.CLOSED);
        when(userRepository.findByEmail(employer.getEmail())).thenReturn(Optional.of(employer));
        when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class, () -> service.updateJob(jobId, request()));

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
    }

    @Test
    void publicSearchDefaultsToOpenAndAppliesFilters() {
        var pageable = PageRequest.of(0, 10);
        when(jobRepository.findAll(any(Specification.class), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(job()), pageable, 1));

        var result = service.searchJobs("Electrician", "Electrical", "Soweto", null, pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals(JobStatus.OPEN, result.getContent().get(0).status());
        verify(jobRepository).findAll(any(Specification.class), eq(pageable));
    }

    @Test
    void missingJobReturnsNotFound() {
        when(jobRepository.findById(jobId)).thenReturn(Optional.empty());
        assertThrows(JobNotFoundException.class, () -> service.getJob(jobId));
    }

    private Job job() {
        Job result = new Job();
        result.setId(jobId);
        result.setEmployer(employer);
        result.setTitle("Electrician");
        result.setDescription("Residential wiring");
        result.setCategory("Electrical");
        result.setEmploymentType(EmploymentType.FULL_TIME);
        result.setStatus(JobStatus.OPEN);
        result.setCity("Soweto");
        result.setProvince("Gauteng");
        return result;
    }

    private JobRequest request() {
        return new JobRequest(" Electrician ", " Residential wiring ", " Electrical ",
                EmploymentType.FULL_TIME, " Soweto ", " Gauteng ");
    }

    private void authenticate(String email) {
        UserDetails principal = org.springframework.security.core.userdetails.User
                .withUsername(email).password("unused").roles("USER").build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }
}
