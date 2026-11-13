package com.kasicircle.backend.workers.repository;

import com.kasicircle.backend.users.entity.AccountType;
import com.kasicircle.backend.users.entity.Role;
import com.kasicircle.backend.users.entity.User;
import com.kasicircle.backend.users.repository.UserRepository;
import com.kasicircle.backend.workers.domain.WorkerProfile;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;

@DataJpaTest
@ActiveProfiles("test")
class WorkerProfileRepositoryTest {

    @Autowired
    private WorkerProfileRepository workerProfileRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void searchesProfilesByKeywordSkillCategoryAndCity() {
        createProfile();

        var matches = workerProfileRepository.searchPublicProfiles(
                "Amahle", "electrical", "wir", "soweto", PageRequest.of(0, 10));
        var noMatches = workerProfileRepository.searchPublicProfiles(
                "Amahle", "plumbing", null, null, PageRequest.of(0, 10));

        assertEquals(1, matches.getTotalElements());
        assertEquals("Qualified Electrician", matches.getContent().get(0).getHeadline());
        assertEquals(0, noMatches.getTotalElements());
    }
    @Test
    void supportsEveryCombinationOfOptionalFiltersAndCountPagination() {
        createProfile();
        for (int mask = 0; mask < 16; mask++) {
            var matches = workerProfileRepository.searchPublicProfiles(
                    (mask & 1) == 0 ? null : "Amahle",
                    (mask & 2) == 0 ? null : "electrical",
                    (mask & 4) == 0 ? null : "wir",
                    (mask & 8) == 0 ? null : "soweto",
                    PageRequest.of(0, 1));
            assertEquals(1, matches.getTotalElements(), "Optional filter combination " + mask);
            assertEquals("Qualified Electrician", matches.getContent().get(0).getHeadline());
        }
    }

    private void createProfile() {
        User worker = userRepository.save(User.builder()
                .firstName("Amahle")
                .lastName("Dube")
                .email("worker@example.com")
                .password("hashed")
                .role(Role.USER)
                .accountType(AccountType.WORKER)
                .enabled(true)
                .build());

        WorkerProfile profile = new WorkerProfile();
        profile.setOwner(worker);
        profile.setHeadline("Qualified Electrician");
        profile.setBio("Home and business wiring");
        profile.setSkills(Set.of("Wiring", "Repairs"));
        profile.setServiceCategories(Set.of("Electrical"));
        profile.setCity("Soweto");
        profile.setProvince("Gauteng");
        workerProfileRepository.saveAndFlush(profile);

    }

}
