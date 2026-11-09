package com.kasicircle.backend.jobs.repository;

import com.kasicircle.backend.jobs.domain.EmploymentType;
import com.kasicircle.backend.jobs.domain.Job;
import com.kasicircle.backend.jobs.domain.JobStatus;
import com.kasicircle.backend.users.entity.Role;
import com.kasicircle.backend.users.entity.User;
import com.kasicircle.backend.users.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertEquals;

@DataJpaTest
@ActiveProfiles("test")
class JobRepositoryTest {

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void filtersPublicJobsByKeywordCategoryCityAndStatus() {
        User employer = userRepository.save(User.builder()
                .firstName("Employer").lastName("Name").email("employer@example.com")
                .password("hashed").role(Role.USER).enabled(true).build());
        Job job = new Job();
        job.setEmployer(employer);
        job.setTitle("Electrician needed");
        job.setDescription("Residential wiring");
        job.setCategory("Electrical");
        job.setEmploymentType(EmploymentType.FULL_TIME);
        job.setStatus(JobStatus.OPEN);
        job.setCity("Soweto");
        job.setProvince("Gauteng");
        jobRepository.saveAndFlush(job);

        var matches = jobRepository.findAll(
                JobSpecifications.withFilters("wiring", "electrical", "soweto", JobStatus.OPEN),
                PageRequest.of(0, 10));
        var closedOnly = jobRepository.findAll(
                JobSpecifications.withFilters(null, null, null, JobStatus.CLOSED),
                PageRequest.of(0, 10));

        assertEquals(1, matches.getTotalElements());
        assertEquals("Electrician needed", matches.getContent().get(0).getTitle());
        assertEquals(0, closedOnly.getTotalElements());
    }
}
