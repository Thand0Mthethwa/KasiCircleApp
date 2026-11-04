package com.kasicircle.backend.businesses.service;

import com.kasicircle.backend.businesses.domain.Business;
import com.kasicircle.backend.businesses.domain.BusinessReview;
import com.kasicircle.backend.businesses.dto.CreateReviewRequest;
import com.kasicircle.backend.businesses.dto.ReviewResponse;
import com.kasicircle.backend.businesses.dto.ReviewSummaryResponse;
import com.kasicircle.backend.businesses.dto.UpdateReviewRequest;
import com.kasicircle.backend.businesses.exception.BusinessNotFoundException;
import com.kasicircle.backend.businesses.exception.ReviewAlreadyExistsException;
import com.kasicircle.backend.businesses.exception.ReviewNotFoundException;
import com.kasicircle.backend.businesses.repository.BusinessRepository;
import com.kasicircle.backend.businesses.repository.BusinessReviewRepository;
import com.kasicircle.backend.users.entity.AccountType;
import com.kasicircle.backend.users.entity.Role;
import com.kasicircle.backend.users.entity.User;
import com.kasicircle.backend.users.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BusinessReviewServiceTest {

    @Mock
    private BusinessReviewRepository reviewRepository;

    @Mock
    private BusinessRepository businessRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private BusinessReviewServiceImpl reviewService;

    private User businessOwner;
    private User reviewer;
    private User otherUser;
    private User adminUser;
    private Business business;
    private UUID businessId;
    private UUID reviewId;
    private BusinessReview existingReview;

    @BeforeEach
    void setUp() {
        businessId = UUID.randomUUID();
        reviewId = UUID.randomUUID();

        businessOwner = User.builder()
                .id(UUID.randomUUID())
                .firstName("Sipho")
                .lastName("Dlamini")
                .email("owner@kasicircle.co.za")
                .role(Role.USER)
                .accountType(AccountType.BUSINESS)
                .build();

        reviewer = User.builder()
                .id(UUID.randomUUID())
                .firstName("Thabo")
                .lastName("Mokoena")
                .email("reviewer@kasicircle.co.za")
                .role(Role.USER)
                .accountType(AccountType.RESIDENT)
                .build();

        otherUser = User.builder()
                .id(UUID.randomUUID())
                .firstName("Lerato")
                .lastName("Khunou")
                .email("other@kasicircle.co.za")
                .role(Role.USER)
                .accountType(AccountType.WORKER)
                .build();

        adminUser = User.builder()
                .id(UUID.randomUUID())
                .firstName("System")
                .lastName("Admin")
                .email("admin@kasicircle.co.za")
                .role(Role.ADMIN)
                .accountType(AccountType.RESIDENT)
                .build();

        business = Business.builder()
                .id(businessId)
                .name("Vilakazi Bakery")
                .owner(businessOwner)
                .build();

        existingReview = BusinessReview.builder()
                .id(reviewId)
                .business(business)
                .author(reviewer)
                .rating(5)
                .comment("Great fresh township bread!")
                .createdAt(Instant.now().minusSeconds(3600))
                .updatedAt(Instant.now().minusSeconds(3600))
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void mockAuthentication(User user) {
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn(user.getEmail());
        Authentication authentication = mock(Authentication.class);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn(userDetails);

        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
    }

    // ==========================================
    // 1. CREATE REVIEW TESTS
    // ==========================================

    @Test
    @DisplayName("Create Review: successfully creates review and safely masks author name")
    void createReview_success() {
        mockAuthentication(reviewer);
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(business));
        when(reviewRepository.existsByBusinessIdAndAuthorId(businessId, reviewer.getId())).thenReturn(false);

        CreateReviewRequest request = CreateReviewRequest.builder()
                .rating(5)
                .comment("Excellent quality!")
                .build();

        when(reviewRepository.save(any(BusinessReview.class))).thenAnswer(invocation -> {
            BusinessReview saved = invocation.getArgument(0);
            saved.setId(reviewId);
            return saved;
        });

        ReviewResponse response = reviewService.createReview(businessId, request);

        assertNotNull(response);
        assertEquals(5, response.rating());
        assertEquals("Excellent quality!", response.comment());
        assertEquals("Thabo M.", response.authorName());
        assertEquals(businessId, response.businessId());

        ArgumentCaptor<BusinessReview> captor = ArgumentCaptor.forClass(BusinessReview.class);
        verify(reviewRepository).save(captor.capture());
        assertEquals(5, captor.getValue().getRating());
        assertEquals("Excellent quality!", captor.getValue().getComment());
    }

    @Test
    @DisplayName("Create Review: prevents duplicate review by same user (throws 409 Conflict)")
    void createReview_duplicateReview_throwsConflict() {
        mockAuthentication(reviewer);
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(business));
        when(reviewRepository.existsByBusinessIdAndAuthorId(businessId, reviewer.getId())).thenReturn(true);

        CreateReviewRequest request = CreateReviewRequest.builder()
                .rating(4)
                .comment("Second review attempt")
                .build();

        ReviewAlreadyExistsException exception = assertThrows(ReviewAlreadyExistsException.class,
                () -> reviewService.createReview(businessId, request));

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        verify(reviewRepository, never()).save(any());
    }

    @Test
    @DisplayName("Create Review: prevents business owner from reviewing their own business (throws 403 Forbidden)")
    void createReview_ownerSelfReview_throwsForbidden() {
        mockAuthentication(businessOwner);
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(business));

        CreateReviewRequest request = CreateReviewRequest.builder()
                .rating(5)
                .comment("Rating my own bakery 5 stars")
                .build();

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> reviewService.createReview(businessId, request));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
        assertTrue(exception.getReason().contains("cannot review their own business"));
        verify(reviewRepository, never()).save(any());
    }

    @Test
    @DisplayName("Create Review: allows optional comment (null)")
    void createReview_withNullComment_succeeds() {
        mockAuthentication(reviewer);
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(business));
        when(reviewRepository.existsByBusinessIdAndAuthorId(businessId, reviewer.getId())).thenReturn(false);

        CreateReviewRequest request = CreateReviewRequest.builder()
                .rating(5)
                .comment(null)
                .build();

        when(reviewRepository.save(any(BusinessReview.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ReviewResponse response = reviewService.createReview(businessId, request);

        assertNotNull(response);
        assertNull(response.comment());
    }

    @Test
    @DisplayName("Create Review: normalizes blank comment to null")
    void createReview_withBlankComment_normalizesToNull() {
        mockAuthentication(reviewer);
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(business));
        when(reviewRepository.existsByBusinessIdAndAuthorId(businessId, reviewer.getId())).thenReturn(false);

        CreateReviewRequest request = CreateReviewRequest.builder()
                .rating(4)
                .comment("    ")
                .build();

        when(reviewRepository.save(any(BusinessReview.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ReviewResponse response = reviewService.createReview(businessId, request);

        assertNotNull(response);
        assertNull(response.comment());
    }

    @Test
    @DisplayName("Create Review: rejects comment exceeding 1000 characters (throws 400 Bad Request)")
    void createReview_withExcessiveCommentLength_throwsBadRequest() {
        mockAuthentication(reviewer);
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(business));
        when(reviewRepository.existsByBusinessIdAndAuthorId(businessId, reviewer.getId())).thenReturn(false);

        String excessiveComment = "a".repeat(1001);
        CreateReviewRequest request = CreateReviewRequest.builder()
                .rating(4)
                .comment(excessiveComment)
                .build();

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> reviewService.createReview(businessId, request));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        verify(reviewRepository, never()).save(any());
    }

    @Test
    @DisplayName("Create Review: rejects rating below 1 (throws 400 Bad Request)")
    void createReview_withRatingBelowOne_throwsBadRequest() {
        mockAuthentication(reviewer);
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(business));
        when(reviewRepository.existsByBusinessIdAndAuthorId(businessId, reviewer.getId())).thenReturn(false);

        CreateReviewRequest request = CreateReviewRequest.builder()
                .rating(0)
                .comment("Bad rating")
                .build();

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> reviewService.createReview(businessId, request));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
    }

    @Test
    @DisplayName("Create Review: rejects rating above 5 (throws 400 Bad Request)")
    void createReview_withRatingAboveFive_throwsBadRequest() {
        mockAuthentication(reviewer);
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(business));
        when(reviewRepository.existsByBusinessIdAndAuthorId(businessId, reviewer.getId())).thenReturn(false);

        CreateReviewRequest request = CreateReviewRequest.builder()
                .rating(6)
                .comment("Too high")
                .build();

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> reviewService.createReview(businessId, request));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
    }

    @Test
    @DisplayName("Create Review: throws 404 when business does not exist")
    void createReview_missingBusiness_throwsNotFound() {
        mockAuthentication(reviewer);
        when(businessRepository.findById(businessId)).thenReturn(Optional.empty());

        CreateReviewRequest request = CreateReviewRequest.builder()
                .rating(5)
                .build();

        assertThrows(BusinessNotFoundException.class,
                () -> reviewService.createReview(businessId, request));
    }

    @Test
    @DisplayName("Create Review: throws 401 when user is unauthenticated")
    void createReview_unauthenticated_throwsUnauthorized() {
        SecurityContextHolder.clearContext();

        CreateReviewRequest request = CreateReviewRequest.builder()
                .rating(5)
                .build();

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> reviewService.createReview(businessId, request));

        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatusCode());
    }

    // ==========================================
    // 2. UPDATE REVIEW TESTS
    // ==========================================

    @Test
    @DisplayName("Update Review: author can successfully update rating and comment")
    void updateReview_asAuthor_succeeds() {
        mockAuthentication(reviewer);
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(business));
        when(reviewRepository.findById(reviewId)).thenReturn(Optional.of(existingReview));
        when(reviewRepository.save(any(BusinessReview.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateReviewRequest request = UpdateReviewRequest.builder()
                .rating(4)
                .comment("Updated: Still good, but service was slower today.")
                .build();

        ReviewResponse response = reviewService.updateReview(businessId, reviewId, request);

        assertNotNull(response);
        assertEquals(4, response.rating());
        assertEquals("Updated: Still good, but service was slower today.", response.comment());
    }

    @Test
    @DisplayName("Update Review: non-author cannot edit review (throws 403 Forbidden)")
    void updateReview_asNonAuthor_throwsForbidden() {
        mockAuthentication(otherUser);
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(business));
        when(reviewRepository.findById(reviewId)).thenReturn(Optional.of(existingReview));

        UpdateReviewRequest request = UpdateReviewRequest.builder()
                .rating(1)
                .comment("Hacked")
                .build();

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> reviewService.updateReview(businessId, reviewId, request));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
        verify(reviewRepository, never()).save(any());
    }

    @Test
    @DisplayName("Update Review: throws 404 when review does not exist")
    void updateReview_missingReview_throwsNotFound() {
        mockAuthentication(reviewer);
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(business));
        when(reviewRepository.findById(reviewId)).thenReturn(Optional.empty());

        UpdateReviewRequest request = UpdateReviewRequest.builder()
                .rating(3)
                .build();

        assertThrows(ReviewNotFoundException.class,
                () -> reviewService.updateReview(businessId, reviewId, request));
    }

    // ==========================================
    // 3. DELETE REVIEW TESTS
    // ==========================================

    @Test
    @DisplayName("Delete Review: author can successfully delete own review")
    void deleteReview_asAuthor_succeeds() {
        mockAuthentication(reviewer);
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(business));
        when(reviewRepository.findById(reviewId)).thenReturn(Optional.of(existingReview));

        reviewService.deleteReview(businessId, reviewId);

        verify(reviewRepository).delete(existingReview);
    }

    @Test
    @DisplayName("Delete Review: ADMIN can moderate and delete another user's review")
    void deleteReview_asAdmin_succeeds() {
        mockAuthentication(adminUser);
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(business));
        when(reviewRepository.findById(reviewId)).thenReturn(Optional.of(existingReview));

        reviewService.deleteReview(businessId, reviewId);

        verify(reviewRepository).delete(existingReview);
    }

    @Test
    @DisplayName("Delete Review: business owner cannot delete customer review (throws 403 Forbidden)")
    void deleteReview_asBusinessOwner_throwsForbidden() {
        mockAuthentication(businessOwner);
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(business));
        when(reviewRepository.findById(reviewId)).thenReturn(Optional.of(existingReview));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> reviewService.deleteReview(businessId, reviewId));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
        verify(reviewRepository, never()).delete(any());
    }

    @Test
    @DisplayName("Delete Review: non-author non-admin user cannot delete review (throws 403 Forbidden)")
    void deleteReview_asNonAuthor_throwsForbidden() {
        mockAuthentication(otherUser);
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(business));
        when(reviewRepository.findById(reviewId)).thenReturn(Optional.of(existingReview));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> reviewService.deleteReview(businessId, reviewId));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
        verify(reviewRepository, never()).delete(any());
    }

    @Test
    @DisplayName("Delete Review: throws 404 when review does not exist")
    void deleteReview_missingReview_throwsNotFound() {
        mockAuthentication(reviewer);
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(business));
        when(reviewRepository.findById(reviewId)).thenReturn(Optional.empty());

        assertThrows(ReviewNotFoundException.class,
                () -> reviewService.deleteReview(businessId, reviewId));
    }

    // ==========================================
    // 4. RETRIEVAL & SUMMARY TESTS
    // ==========================================

    @Test
    @DisplayName("Get Rating Summary: calculates correct average and star distribution")
    void getRatingSummary_withReviews_calculatesCorrectDistribution() {
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(business));

        // 2x 5-star, 1x 4-star, 1x 3-star
        List<Object[]> rows = new ArrayList<>();
        rows.add(new Object[]{5, 2L});
        rows.add(new Object[]{4, 1L});
        rows.add(new Object[]{3, 1L});

        when(reviewRepository.countReviewsGroupedByRating(businessId)).thenReturn(rows);

        ReviewSummaryResponse summary = reviewService.getRatingSummary(businessId);

        assertNotNull(summary);
        assertEquals(businessId, summary.businessId());
        assertEquals(4L, summary.totalReviews());
        assertEquals(4.25, summary.averageRating());
        assertEquals(2L, summary.fiveStarCount());
        assertEquals(1L, summary.fourStarCount());
        assertEquals(1L, summary.threeStarCount());
        assertEquals(0L, summary.twoStarCount());
        assertEquals(0L, summary.oneStarCount());
    }

    @Test
    @DisplayName("Get Rating Summary: handles zero reviews cleanly")
    void getRatingSummary_zeroReviews_returnsZeroStats() {
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(business));
        when(reviewRepository.countReviewsGroupedByRating(businessId)).thenReturn(Collections.emptyList());

        ReviewSummaryResponse summary = reviewService.getRatingSummary(businessId);

        assertNotNull(summary);
        assertEquals(businessId, summary.businessId());
        assertEquals(0L, summary.totalReviews());
        assertEquals(0.0, summary.averageRating());
        assertEquals(0L, summary.fiveStarCount());
        assertEquals(0L, summary.fourStarCount());
        assertEquals(0L, summary.threeStarCount());
        assertEquals(0L, summary.twoStarCount());
        assertEquals(0L, summary.oneStarCount());
    }

    @Test
    @DisplayName("Get Reviews For Business: paginated list returns mapped responses")
    void getReviewsForBusiness_paginated_returnsMappedPage() {
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(business));
        Pageable pageable = PageRequest.of(0, 10);
        Page<BusinessReview> reviewPage = new PageImpl<>(List.of(existingReview));
        when(reviewRepository.findByBusinessId(businessId, pageable)).thenReturn(reviewPage);

        Page<ReviewResponse> responsePage = reviewService.getReviewsForBusiness(businessId, pageable);

        assertNotNull(responsePage);
        assertEquals(1, responsePage.getTotalElements());
        assertEquals("Thabo M.", responsePage.getContent().get(0).authorName());
    }

    @Test
    @DisplayName("Get My Review: returns current user's review when present")
    void getMyReviewForBusiness_whenExists_returnsReview() {
        mockAuthentication(reviewer);
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(business));
        when(reviewRepository.findByBusinessIdAndAuthorId(businessId, reviewer.getId()))
                .thenReturn(Optional.of(existingReview));

        Optional<ReviewResponse> myReview = reviewService.getMyReviewForBusiness(businessId);

        assertTrue(myReview.isPresent());
        assertEquals(5, myReview.get().rating());
        assertEquals("Thabo M.", myReview.get().authorName());
    }

    @Test
    @DisplayName("Get My Review: returns empty when unauthenticated or no review exists")
    void getMyReviewForBusiness_whenAbsent_returnsEmpty() {
        mockAuthentication(reviewer);
        when(businessRepository.findById(businessId)).thenReturn(Optional.of(business));
        when(reviewRepository.findByBusinessIdAndAuthorId(businessId, reviewer.getId()))
                .thenReturn(Optional.empty());

        Optional<ReviewResponse> myReview = reviewService.getMyReviewForBusiness(businessId);

        assertTrue(myReview.isEmpty());
    }
}

