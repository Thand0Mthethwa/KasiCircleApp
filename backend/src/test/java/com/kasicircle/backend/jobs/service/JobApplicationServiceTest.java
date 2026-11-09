package com.kasicircle.backend.jobs.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kasicircle.backend.jobs.domain.ApplicationStatus;
import com.kasicircle.backend.jobs.domain.EmploymentType;
import com.kasicircle.backend.jobs.domain.Job;
import com.kasicircle.backend.jobs.domain.JobApplication;
import com.kasicircle.backend.jobs.domain.JobStatus;
import com.kasicircle.backend.jobs.dto.JobApplicationRequest;
import com.kasicircle.backend.jobs.dto.JobApplicationResponse;
import com.kasicircle.backend.jobs.exception.JobApplicationNotFoundException;
import com.kasicircle.backend.jobs.repository.JobApplicationRepository;
import com.kasicircle.backend.jobs.repository.JobRepository;
import com.kasicircle.backend.users.entity.User;
import com.kasicircle.backend.users.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JobApplicationServiceTest {

    @Mock
    private JobApplicationRepository applicationRepository;

    @Mock
    private JobRepository jobRepository;

    @Mock
    private UserRepository userRepository;

    private JobApplicationServiceImpl service;
    private User employer;
    private User applicant;
    private Job job;
    private final UUID jobId = UUID.randomUUID();
    private final UUID applicationId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        service = new JobApplicationServiceImpl(applicationRepository, jobRepository, userRepository);
        employer = User.builder().id(UUID.randomUUID()).firstName("Employer").lastName("Name")
                .email("employer@example.com").build();
        applicant = User.builder().id(UUID.randomUUID()).firstName("Applicant").lastName("Name")
                .email("applicant@example.com").phoneNumber("+27820000000").build();
        job = job();
        authenticate(applicant.getEmail());
    }

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void applicantCanApplyAndEmployerContactIsNotExposed() throws Exception {
        when(userRepository.findByEmail(applicant.getEmail())).thenReturn(Optional.of(applicant));
        when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));
        when(applicationRepository.existsByJobIdAndApplicantId(jobId, applicant.getId())).thenReturn(false);
        when(applicationRepository.save(any(JobApplication.class))).thenAnswer(invocation -> {
            JobApplication saved = invocation.getArgument(0);
            saved.setId(applicationId);
            return saved;
        });

        JobApplicationResponse response = service.apply(jobId, new JobApplicationRequest("I have experience."));
        String json = new ObjectMapper().writeValueAsString(response);

        assertEquals(applicationId, response.id());
        assertEquals("Electrician", response.jobTitle());
        assertEquals(ApplicationStatus.PENDING, response.status());
        org.junit.jupiter.api.Assertions.assertFalse(json.contains("applicant@example.com"));
        org.junit.jupiter.api.Assertions.assertFalse(json.contains("+27820000000"));
    }

    @Test
    void duplicateOrClosedJobApplicationIsRejected() {
        when(userRepository.findByEmail(applicant.getEmail())).thenReturn(Optional.of(applicant));
        when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));
        when(applicationRepository.existsByJobIdAndApplicantId(jobId, applicant.getId())).thenReturn(true);

        ResponseStatusException duplicate = assertThrows(ResponseStatusException.class,
                () -> service.apply(jobId, new JobApplicationRequest(null)));
        assertEquals(HttpStatus.CONFLICT, duplicate.getStatusCode());
        verify(applicationRepository, never()).save(any());

        job.setStatus(JobStatus.CLOSED);
        ResponseStatusException closed = assertThrows(ResponseStatusException.class,
                () -> service.apply(jobId, new JobApplicationRequest(null)));
        assertEquals(HttpStatus.CONFLICT, closed.getStatusCode());
    }

    @Test
    void employerCannotApplyToOwnJob() {
        when(userRepository.findByEmail(employer.getEmail())).thenReturn(Optional.of(employer));
        authenticate(employer.getEmail());
        when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.apply(jobId, new JobApplicationRequest(null)));

        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
        verify(applicationRepository, never()).save(any());
    }

    @Test
    void onlyEmployerCanReviewApplications() {
        when(userRepository.findByEmail(applicant.getEmail())).thenReturn(Optional.of(applicant));
        when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.getApplicationsForJob(jobId));

        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
        verify(applicationRepository, never()).findByJobIdOrderByCreatedAtDesc(jobId);
    }

    @Test
    void employerCanAcceptPendingApplicationAndCannotResetIt() {
        authenticate(employer.getEmail());
        when(userRepository.findByEmail(employer.getEmail())).thenReturn(Optional.of(employer));
        when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));
        JobApplication application = application();
        when(applicationRepository.findByIdAndJobId(applicationId, jobId)).thenReturn(Optional.of(application));
        when(applicationRepository.save(application)).thenReturn(application);

        JobApplicationResponse response = service.updateApplicationStatus(
                jobId, applicationId, ApplicationStatus.ACCEPTED);
        assertEquals(ApplicationStatus.ACCEPTED, response.status());

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.updateApplicationStatus(jobId, applicationId, ApplicationStatus.REJECTED));
        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
    }

    @Test
    void unknownApplicationReturnsNotFound() {
        authenticate(employer.getEmail());
        when(userRepository.findByEmail(employer.getEmail())).thenReturn(Optional.of(employer));
        when(jobRepository.findById(jobId)).thenReturn(Optional.of(job));
        when(applicationRepository.findByIdAndJobId(applicationId, jobId)).thenReturn(Optional.empty());

        assertThrows(JobApplicationNotFoundException.class,
                () -> service.updateApplicationStatus(jobId, applicationId, ApplicationStatus.ACCEPTED));
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

    private JobApplication application() {
        JobApplication result = new JobApplication();
        result.setId(applicationId);
        result.setJob(job);
        result.setApplicant(applicant);
        result.setMessage("Experienced electrician");
        result.setStatus(ApplicationStatus.PENDING);
        return result;
    }

    private void authenticate(String email) {
        UserDetails principal = org.springframework.security.core.userdetails.User
                .withUsername(email).password("unused").roles("USER").build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }
}
