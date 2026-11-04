package com.kasicircle.backend.businesses.repository;

import com.kasicircle.backend.businesses.domain.Business;
import com.kasicircle.backend.businesses.domain.BusinessReview;
import com.kasicircle.backend.users.entity.AccountType;
import com.kasicircle.backend.users.entity.Role;
import com.kasicircle.backend.users.entity.User;
import com.kasicircle.backend.users.repository.UserRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class BusinessReviewRepositoryTest {

    @Autowired
    private BusinessReviewRepository reviewRepository;

    @Autowired
    private BusinessRepository businessRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EntityManager entityManager;

    private User owner1;
    private User owner2;
    private User reviewer1;
    private User reviewer2;
    private Business business1;
    private Business business2;

    @BeforeEach
    void setUp() {
        reviewRepository.deleteAll();
        businessRepository.deleteAll();
        userRepository.deleteAll();
        entityManager.flush();

        owner1 = userRepository.save(User.builder()
                .firstName("Sipho")
                .lastName("Dlamini")
                .email("sipho.owner@kasicircle.co.za")
                .phoneNumber("+27821112233")
                .password("Password123!")
                .role(Role.USER)
                .accountType(AccountType.BUSINESS)
                .enabled(true)
                .build());

        owner2 = userRepository.save(User.builder()
                .firstName("Kagiso")
                .lastName("Molefe")
                .email("kagiso.owner@kasicircle.co.za")
                .phoneNumber("+27822223344")
                .password("Password123!")
                .role(Role.USER)
                .accountType(AccountType.BUSINESS)
                .enabled(true)
                .build());

        reviewer1 = userRepository.save(User.builder()
                .firstName("Thabo")
                .lastName("Mokoena")
                .email("thabo.reviewer@kasicircle.co.za")
                .phoneNumber("+27823334455")
                .password("Password123!")
                .role(Role.USER)
                .accountType(AccountType.RESIDENT)
                .enabled(true)
                .build());

        reviewer2 = userRepository.save(User.builder()
                .firstName("Lerato")
                .lastName("Khunou")
                .email("lerato.reviewer@kasicircle.co.za")
                .phoneNumber("+27824445566")
                .password("Password123!")
                .role(Role.USER)
                .accountType(AccountType.RESIDENT)
                .enabled(true)
                .build());

        business1 = businessRepository.save(Business.builder()
                .name("Soweto Gold Bakery")
                .description("Artisan township bread and pastries")
                .phoneNumber("+27119876543")
                .email("info@sowetogoldbakery.co.za")
                .category("Food & Beverage")
                .address("42 Vilakazi Street")
                .city("Soweto")
                .province("Gauteng")
                .owner(owner1)
                .build());

        business2 = businessRepository.save(Business.builder()
                .name("Kasi Tech Hub")
                .description("Affordable smartphone repairs and IT services")
                .phoneNumber("+27119876544")
                .email("help@kasitechhub.co.za")
                .category("Technology & Electronics")
                .address("108 Koma Road")
                .city("Soweto")
                .province("Gauteng")
                .owner(owner2)
                .build());

        entityManager.flush();
    }

    @Test
    @DisplayName("1. Saving a valid review persists all fields and generates timestamps")
    void saveValidReview_shouldPersistReviewWithTimestamps() {
        BusinessReview review = BusinessReview.builder()
                .business(business1)
                .author(reviewer1)
                .rating(5)
                .comment("Best scones and fresh bread in Vilakazi street!")
                .build();

        BusinessReview savedReview = reviewRepository.save(review);
        entityManager.flush();
        entityManager.clear();

        assertThat(savedReview.getId()).isNotNull();
        assertThat(savedReview.getRating()).isEqualTo(5);
        assertThat(savedReview.getComment()).isEqualTo("Best scones and fresh bread in Vilakazi street!");
        assertThat(savedReview.getCreatedAt()).isNotNull();
        assertThat(savedReview.getUpdatedAt()).isNotNull();
    }

    @Test
    @DisplayName("2. Retrieving a review by ID returns the populated entity")
    void findById_shouldReturnSavedReview() {
        BusinessReview review = reviewRepository.save(BusinessReview.builder()
                .business(business1)
                .author(reviewer1)
                .rating(4)
                .comment("Great service, friendly staff")
                .build());
        entityManager.flush();
        entityManager.clear();

        Optional<BusinessReview> found = reviewRepository.findById(review.getId());

        assertThat(found).isPresent();
        assertThat(found.get().getId()).isEqualTo(review.getId());
        assertThat(found.get().getRating()).isEqualTo(4);
        assertThat(found.get().getComment()).isEqualTo("Great service, friendly staff");
        assertThat(found.get().getBusiness().getId()).isEqualTo(business1.getId());
        assertThat(found.get().getAuthor().getId()).isEqualTo(reviewer1.getId());
    }

    @Test
    @DisplayName("3. Finding reviews by business supports listing, ordering, and pagination")
    void findReviewsByBusiness_shouldReturnAllReviewsForThatBusiness() {
        reviewRepository.save(BusinessReview.builder()
                .business(business1)
                .author(reviewer1)
                .rating(5)
                .comment("First review")
                .build());

        reviewRepository.save(BusinessReview.builder()
                .business(business1)
                .author(reviewer2)
                .rating(4)
                .comment("Second review")
                .build());

        entityManager.flush();
        entityManager.clear();

        List<BusinessReview> reviews = reviewRepository.findByBusinessId(business1.getId());
        assertThat(reviews).hasSize(2);

        List<BusinessReview> orderedReviews = reviewRepository.findByBusinessIdOrderByCreatedAtDesc(business1.getId());
        assertThat(orderedReviews).hasSize(2);

        Page<BusinessReview> page = reviewRepository.findByBusinessId(
                business1.getId(),
                PageRequest.of(0, 1, Sort.by("createdAt").descending())
        );
        assertThat(page.getTotalElements()).isEqualTo(2);
        assertThat(page.getTotalPages()).isEqualTo(2);
        assertThat(page.getContent()).hasSize(1);

        long count = reviewRepository.countByBusinessId(business1.getId());
        assertThat(count).isEqualTo(2);
    }

    @Test
    @DisplayName("4. Finding a user's review for a business returns the matching review")
    void findByBusinessIdAndAuthorId_shouldReturnMatchingReview() {
        reviewRepository.save(BusinessReview.builder()
                .business(business1)
                .author(reviewer1)
                .rating(5)
                .comment("Top tier township bakery!")
                .build());
        entityManager.flush();
        entityManager.clear();

        Optional<BusinessReview> reviewOpt = reviewRepository.findByBusinessIdAndAuthorId(
                business1.getId(),
                reviewer1.getId()
        );

        assertThat(reviewOpt).isPresent();
        assertThat(reviewOpt.get().getRating()).isEqualTo(5);
        assertThat(reviewOpt.get().getComment()).isEqualTo("Top tier township bakery!");

        Optional<BusinessReview> nonExistent = reviewRepository.findByBusinessIdAndAuthorId(
                business1.getId(),
                reviewer2.getId()
        );
        assertThat(nonExistent).isEmpty();
    }

    @Test
    @DisplayName("5. Detecting an existing review returns true when present and false when absent")
    void existsByBusinessIdAndAuthorId_shouldDetectExistingReview() {
        reviewRepository.save(BusinessReview.builder()
                .business(business1)
                .author(reviewer1)
                .rating(5)
                .comment("Excellent quality!")
                .build());
        entityManager.flush();

        boolean exists = reviewRepository.existsByBusinessIdAndAuthorId(business1.getId(), reviewer1.getId());
        boolean doesNotExist = reviewRepository.existsByBusinessIdAndAuthorId(business1.getId(), reviewer2.getId());

        assertThat(exists).isTrue();
        assertThat(doesNotExist).isFalse();
    }

    @Test
    @DisplayName("6. Rejecting duplicate reviews for the same business and user enforces uniqueness")
    void duplicateReview_sameBusinessAndAuthor_shouldThrowException() {
        reviewRepository.save(BusinessReview.builder()
                .business(business1)
                .author(reviewer1)
                .rating(5)
                .comment("First submission")
                .build());
        entityManager.flush();

        BusinessReview duplicate = BusinessReview.builder()
                .business(business1)
                .author(reviewer1)
                .rating(4)
                .comment("Second submission attempt")
                .build();

        Exception exception = assertThrows(Exception.class, () -> {
            reviewRepository.save(duplicate);
            entityManager.flush();
        });

        assertThat(exception).satisfiesAnyOf(
                e -> assertThat(e).isInstanceOf(DataIntegrityViolationException.class),
                e -> assertThat(e).isInstanceOf(org.hibernate.exception.ConstraintViolationException.class)
        );
    }

    @Test
    @DisplayName("7. Rejecting ratings below 1 at database and validation level")
    void saveReview_withRatingBelowOne_shouldThrowException() {
        BusinessReview review = BusinessReview.builder()
                .business(business1)
                .author(reviewer1)
                .rating(0)
                .comment("Rating too low")
                .build();

        assertThrows(Exception.class, () -> {
            reviewRepository.save(review);
            entityManager.flush();
        });
    }

    @Test
    @DisplayName("8. Rejecting ratings above 5 at database and validation level")
    void saveReview_withRatingAboveFive_shouldThrowException() {
        BusinessReview review = BusinessReview.builder()
                .business(business1)
                .author(reviewer1)
                .rating(6)
                .comment("Rating too high")
                .build();

        assertThrows(Exception.class, () -> {
            reviewRepository.save(review);
            entityManager.flush();
        });
    }

    @Test
    @DisplayName("9. Allowing multiple users to review the same business")
    void multipleUsers_reviewSameBusiness_shouldAllSucceed() {
        BusinessReview review1 = reviewRepository.save(BusinessReview.builder()
                .business(business1)
                .author(reviewer1)
                .rating(5)
                .comment("Reviewer 1 comment")
                .build());

        BusinessReview review2 = reviewRepository.save(BusinessReview.builder()
                .business(business1)
                .author(reviewer2)
                .rating(4)
                .comment("Reviewer 2 comment")
                .build());

        entityManager.flush();
        entityManager.clear();

        List<BusinessReview> reviews = reviewRepository.findByBusinessId(business1.getId());
        assertThat(reviews).hasSize(2);
        assertThat(reviews).extracting(BusinessReview::getId).containsExactlyInAnyOrder(review1.getId(), review2.getId());
    }

    @Test
    @DisplayName("10. Allowing one user to review different businesses")
    void singleUser_reviewDifferentBusinesses_shouldAllSucceed() {
        BusinessReview reviewForBiz1 = reviewRepository.save(BusinessReview.builder()
                .business(business1)
                .author(reviewer1)
                .rating(5)
                .comment("Review for business 1")
                .build());

        BusinessReview reviewForBiz2 = reviewRepository.save(BusinessReview.builder()
                .business(business2)
                .author(reviewer1)
                .rating(4)
                .comment("Review for business 2")
                .build());

        entityManager.flush();
        entityManager.clear();

        List<BusinessReview> authorReviews = reviewRepository.findByAuthorId(reviewer1.getId());
        assertThat(authorReviews).hasSize(2);
        assertThat(authorReviews).extracting(BusinessReview::getId).containsExactlyInAnyOrder(reviewForBiz1.getId(), reviewForBiz2.getId());

        List<BusinessReview> authorReviewsOrdered = reviewRepository.findByAuthorIdOrderByCreatedAtDesc(reviewer1.getId());
        assertThat(authorReviewsOrdered).hasSize(2);

        Page<BusinessReview> authorReviewsPaged = reviewRepository.findByAuthorId(
                reviewer1.getId(),
                PageRequest.of(0, 10)
        );
        assertThat(authorReviewsPaged.getTotalElements()).isEqualTo(2);
    }

    @Test
    @DisplayName("11. Flyway V6 migration applies cleanly against test database")
    void flywayMigration_shouldApplyV6Successfully() throws Exception {
        String h2Url = "jdbc:h2:mem:v6_migration_test;MODE=PostgreSQL;DB_CLOSE_DELAY=-1";
        try (var conn = java.sql.DriverManager.getConnection(h2Url, "sa", "password");
             var stmt = conn.createStatement()) {

            // Create prerequisite tables needed for FKs
            stmt.execute("CREATE TABLE users (id UUID PRIMARY KEY)");
            stmt.execute("CREATE TABLE businesses (id UUID PRIMARY KEY)");

            // Execute V6 migration script via Spring ScriptUtils
            org.springframework.jdbc.datasource.init.ScriptUtils.executeSqlScript(
                    conn,
                    new org.springframework.core.io.ClassPathResource("db/migration/V6__create_business_reviews_table.sql")
            );

            // Verify table exists
            var rs = stmt.executeQuery("SELECT table_name FROM information_schema.tables WHERE table_name = 'BUSINESS_REVIEWS'");
            assertThat(rs.next()).isTrue();
        }
    }
}

