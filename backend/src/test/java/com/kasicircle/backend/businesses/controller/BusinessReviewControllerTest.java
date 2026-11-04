package com.kasicircle.backend.businesses.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kasicircle.backend.businesses.dto.CreateReviewRequest;
import com.kasicircle.backend.businesses.dto.ReviewResponse;
import com.kasicircle.backend.businesses.dto.ReviewSummaryResponse;
import com.kasicircle.backend.businesses.dto.UpdateReviewRequest;
import com.kasicircle.backend.businesses.exception.BusinessNotFoundException;
import com.kasicircle.backend.businesses.exception.ReviewAlreadyExistsException;
import com.kasicircle.backend.businesses.exception.ReviewNotFoundException;
import com.kasicircle.backend.businesses.service.BusinessReviewService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BusinessReviewControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private BusinessReviewService reviewService;

    @Autowired
    private ObjectMapper objectMapper;

    private final UUID businessId = UUID.randomUUID();
    private final UUID reviewId = UUID.randomUUID();

    private ReviewResponse buildSampleReviewResponse() {
        return ReviewResponse.builder()
                .id(reviewId)
                .businessId(businessId)
                .rating(5)
                .comment("Outstanding township service!")
                .authorName("Thabo M.")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    private ReviewSummaryResponse buildSampleSummaryResponse() {
        return ReviewSummaryResponse.builder()
                .businessId(businessId)
                .averageRating(4.25)
                .totalReviews(4L)
                .fiveStarCount(2L)
                .fourStarCount(1L)
                .threeStarCount(1L)
                .twoStarCount(0L)
                .oneStarCount(0L)
                .build();
    }

    // =========================================================================
    // 1. PUBLIC GET REVIEWS & SUMMARY TESTS
    // =========================================================================

    @Test
    @DisplayName("1. Anonymous users can retrieve public reviews")
    @WithAnonymousUser
    void getReviews_anonymous_shouldReturnOkWithPage() throws Exception {
        ReviewResponse review = buildSampleReviewResponse();
        when(reviewService.getReviewsForBusiness(eq(businessId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(review)));

        mockMvc.perform(get("/api/businesses/{businessId}/reviews", businessId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(reviewId.toString()))
                .andExpect(jsonPath("$.content[0].rating").value(5))
                .andExpect(jsonPath("$.content[0].authorName").value("Thabo M."))
                .andExpect(jsonPath("$.content[0].comment").value("Outstanding township service!"));
    }

    @Test
    @DisplayName("2. Anonymous users can retrieve rating summaries")
    @WithAnonymousUser
    void getSummary_anonymous_shouldReturnOkWithSummary() throws Exception {
        when(reviewService.getRatingSummary(businessId)).thenReturn(buildSampleSummaryResponse());

        mockMvc.perform(get("/api/businesses/{businessId}/reviews/summary", businessId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.businessId").value(businessId.toString()))
                .andExpect(jsonPath("$.averageRating").value(4.25))
                .andExpect(jsonPath("$.totalReviews").value(4))
                .andExpect(jsonPath("$.fiveStarCount").value(2))
                .andExpect(jsonPath("$.oneStarCount").value(0));
    }

    // =========================================================================
    // 2. /REVIEWS/ME AUTHENTICATION TESTS
    // =========================================================================

    @Test
    @DisplayName("3. Anonymous users cannot access /reviews/me (returns 401)")
    @WithAnonymousUser
    void getMyReview_anonymous_shouldReturnUnauthorized() throws Exception {
        mockMvc.perform(get("/api/businesses/{businessId}/reviews/me", businessId))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("4a. Authenticated users can access /reviews/me (returns 200 when found)")
    @WithMockUser(username = "user@example.com")
    void getMyReview_authenticated_whenExists_shouldReturnOk() throws Exception {
        ReviewResponse review = buildSampleReviewResponse();
        when(reviewService.getMyReviewForBusiness(businessId)).thenReturn(Optional.of(review));

        mockMvc.perform(get("/api/businesses/{businessId}/reviews/me", businessId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(reviewId.toString()))
                .andExpect(jsonPath("$.rating").value(5))
                .andExpect(jsonPath("$.authorName").value("Thabo M."));
    }

    @Test
    @DisplayName("4b. Authenticated users accessing /reviews/me returns 204 No Content when not found")
    @WithMockUser(username = "user@example.com")
    void getMyReview_authenticated_whenAbsent_shouldReturnNoContent() throws Exception {
        when(reviewService.getMyReviewForBusiness(businessId)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/businesses/{businessId}/reviews/me", businessId))
                .andExpect(status().isNoContent());
    }

    // =========================================================================
    // 3. POST /REVIEWS TESTS
    // =========================================================================

    @Test
    @DisplayName("5. Authenticated users can create reviews (returns 201 Created)")
    @WithMockUser(username = "user@example.com")
    void createReview_authenticated_shouldReturnCreated() throws Exception {
        CreateReviewRequest request = CreateReviewRequest.builder()
                .rating(5)
                .comment("Excellent local business!")
                .build();

        ReviewResponse response = buildSampleReviewResponse();
        when(reviewService.createReview(eq(businessId), any(CreateReviewRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/businesses/{businessId}/reviews", businessId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(reviewId.toString()))
                .andExpect(jsonPath("$.rating").value(5))
                .andExpect(jsonPath("$.authorName").value("Thabo M."));
    }

    @Test
    @DisplayName("6. Anonymous users cannot create reviews (returns 401 Unauthorized)")
    @WithAnonymousUser
    void createReview_anonymous_shouldReturnUnauthorized() throws Exception {
        CreateReviewRequest request = CreateReviewRequest.builder()
                .rating(5)
                .comment("Anonymous review attempt")
                .build();

        mockMvc.perform(post("/api/businesses/{businessId}/reviews", businessId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // 4. PUT /REVIEWS/{ID} TESTS
    // =========================================================================

    @Test
    @DisplayName("7. Authenticated users can update reviews (returns 200 OK)")
    @WithMockUser(username = "user@example.com")
    void updateReview_authenticated_shouldReturnOk() throws Exception {
        UpdateReviewRequest request = UpdateReviewRequest.builder()
                .rating(4)
                .comment("Updated review comment")
                .build();

        ReviewResponse updatedResponse = ReviewResponse.builder()
                .id(reviewId)
                .businessId(businessId)
                .rating(4)
                .comment("Updated review comment")
                .authorName("Thabo M.")
                .createdAt(Instant.now().minusSeconds(100))
                .updatedAt(Instant.now())
                .build();

        when(reviewService.updateReview(eq(businessId), eq(reviewId), any(UpdateReviewRequest.class)))
                .thenReturn(updatedResponse);

        mockMvc.perform(put("/api/businesses/{businessId}/reviews/{reviewId}", businessId, reviewId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(reviewId.toString()))
                .andExpect(jsonPath("$.rating").value(4))
                .andExpect(jsonPath("$.comment").value("Updated review comment"));
    }

    @Test
    @DisplayName("8. Anonymous users cannot update reviews (returns 401 Unauthorized)")
    @WithAnonymousUser
    void updateReview_anonymous_shouldReturnUnauthorized() throws Exception {
        UpdateReviewRequest request = UpdateReviewRequest.builder()
                .rating(4)
                .comment("Unauthorized update")
                .build();

        mockMvc.perform(put("/api/businesses/{businessId}/reviews/{reviewId}", businessId, reviewId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // 5. DELETE /REVIEWS/{ID} TESTS
    // =========================================================================

    @Test
    @DisplayName("9. Authenticated users can delete reviews (returns 204 No Content)")
    @WithMockUser(username = "user@example.com")
    void deleteReview_authenticated_shouldReturnNoContent() throws Exception {
        doNothing().when(reviewService).deleteReview(businessId, reviewId);

        mockMvc.perform(delete("/api/businesses/{businessId}/reviews/{reviewId}", businessId, reviewId))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("10. Anonymous users cannot delete reviews (returns 401 Unauthorized)")
    @WithAnonymousUser
    void deleteReview_anonymous_shouldReturnUnauthorized() throws Exception {
        mockMvc.perform(delete("/api/businesses/{businessId}/reviews/{reviewId}", businessId, reviewId))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // 6. VALIDATION & ERROR HANDLING TESTS
    // =========================================================================

    @Test
    @DisplayName("11a. Invalid rating below 1 returns 400 Bad Request")
    @WithMockUser(username = "user@example.com")
    void createReview_ratingBelowOne_shouldReturnBadRequest() throws Exception {
        CreateReviewRequest request = CreateReviewRequest.builder()
                .rating(0)
                .comment("Bad rating")
                .build();

        mockMvc.perform(post("/api/businesses/{businessId}/reviews", businessId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation Error"));
    }

    @Test
    @DisplayName("11b. Invalid rating above 5 returns 400 Bad Request")
    @WithMockUser(username = "user@example.com")
    void createReview_ratingAboveFive_shouldReturnBadRequest() throws Exception {
        CreateReviewRequest request = CreateReviewRequest.builder()
                .rating(6)
                .comment("Too high")
                .build();

        mockMvc.perform(post("/api/businesses/{businessId}/reviews", businessId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation Error"));
    }

    @Test
    @DisplayName("11c. Missing rating returns 400 Bad Request")
    @WithMockUser(username = "user@example.com")
    void createReview_nullRating_shouldReturnBadRequest() throws Exception {
        CreateReviewRequest request = CreateReviewRequest.builder()
                .rating(null)
                .comment("Missing rating")
                .build();

        mockMvc.perform(post("/api/businesses/{businessId}/reviews", businessId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation Error"));
    }

    @Test
    @DisplayName("11d. Excessive comment length (>1000) returns 400 Bad Request")
    @WithMockUser(username = "user@example.com")
    void createReview_excessiveCommentLength_shouldReturnBadRequest() throws Exception {
        CreateReviewRequest request = CreateReviewRequest.builder()
                .rating(5)
                .comment("a".repeat(1001))
                .build();

        mockMvc.perform(post("/api/businesses/{businessId}/reviews", businessId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation Error"));
    }

    @Test
    @DisplayName("12. Duplicate reviews return HTTP 409 Conflict")
    @WithMockUser(username = "user@example.com")
    void createReview_duplicateReview_shouldReturnConflict() throws Exception {
        CreateReviewRequest request = CreateReviewRequest.builder()
                .rating(5)
                .comment("Duplicate review attempt")
                .build();

        when(reviewService.createReview(eq(businessId), any(CreateReviewRequest.class)))
                .thenThrow(new ReviewAlreadyExistsException("You have already reviewed this business. You can update your existing review."));

        mockMvc.perform(post("/api/businesses/{businessId}/reviews", businessId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Conflict"));
    }

    @Test
    @DisplayName("13a. Missing business returns HTTP 404 Not Found")
    @WithMockUser(username = "user@example.com")
    void createReview_missingBusiness_shouldReturnNotFound() throws Exception {
        CreateReviewRequest request = CreateReviewRequest.builder()
                .rating(5)
                .comment("Review for missing business")
                .build();

        when(reviewService.createReview(eq(businessId), any(CreateReviewRequest.class)))
                .thenThrow(new BusinessNotFoundException("Business with ID " + businessId + " not found."));

        mockMvc.perform(post("/api/businesses/{businessId}/reviews", businessId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Not Found"));
    }

    @Test
    @DisplayName("13b. Missing review returns HTTP 404 Not Found")
    @WithMockUser(username = "user@example.com")
    void updateReview_missingReview_shouldReturnNotFound() throws Exception {
        UpdateReviewRequest request = UpdateReviewRequest.builder()
                .rating(4)
                .comment("Update missing review")
                .build();

        when(reviewService.updateReview(eq(businessId), eq(reviewId), any(UpdateReviewRequest.class)))
                .thenThrow(new ReviewNotFoundException("Review with ID " + reviewId + " not found."));

        mockMvc.perform(put("/api/businesses/{businessId}/reviews/{reviewId}", businessId, reviewId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Not Found"));
    }

    @Test
    @DisplayName("14a. Owner self-review throws 403 Forbidden")
    @WithMockUser(username = "owner@example.com")
    void createReview_ownerSelfReview_shouldReturnForbidden() throws Exception {
        CreateReviewRequest request = CreateReviewRequest.builder()
                .rating(5)
                .comment("Self review attempt")
                .build();

        when(reviewService.createReview(eq(businessId), any(CreateReviewRequest.class)))
                .thenThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "Business owners cannot review their own business."));

        mockMvc.perform(post("/api/businesses/{businessId}/reviews", businessId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @DisplayName("14b. Non-author edit throws 403 Forbidden")
    @WithMockUser(username = "other@example.com")
    void updateReview_nonAuthor_shouldReturnForbidden() throws Exception {
        UpdateReviewRequest request = UpdateReviewRequest.builder()
                .rating(2)
                .comment("Unauthorized edit")
                .build();

        when(reviewService.updateReview(eq(businessId), eq(reviewId), any(UpdateReviewRequest.class)))
                .thenThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not authorized to edit this review."));

        mockMvc.perform(put("/api/businesses/{businessId}/reviews/{reviewId}", businessId, reviewId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @DisplayName("14c. Non-author delete throws 403 Forbidden")
    @WithMockUser(username = "other@example.com")
    void deleteReview_nonAuthor_shouldReturnForbidden() throws Exception {
        doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not authorized to delete this review."))
                .when(reviewService).deleteReview(businessId, reviewId);

        mockMvc.perform(delete("/api/businesses/{businessId}/reviews/{reviewId}", businessId, reviewId))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }
}

