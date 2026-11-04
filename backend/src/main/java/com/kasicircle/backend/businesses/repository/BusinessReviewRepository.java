package com.kasicircle.backend.businesses.repository;

import com.kasicircle.backend.businesses.domain.BusinessReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for {@link BusinessReview} entities.
 */
@Repository
public interface BusinessReviewRepository extends JpaRepository<BusinessReview, UUID> {

    /**
     * Checks whether an author has already submitted a review for the specified business.
     *
     * @param businessId The UUID of the business.
     * @param authorId The UUID of the authoring user.
     * @return true if a review exists, false otherwise.
     */
    boolean existsByBusinessIdAndAuthorId(UUID businessId, UUID authorId);

    /**
     * Finds a review for a specific business submitted by a specific author.
     *
     * @param businessId The UUID of the business.
     * @param authorId The UUID of the authoring user.
     * @return An Optional containing the review if found.
     */
    @EntityGraph(attributePaths = {"author"})
    Optional<BusinessReview> findByBusinessIdAndAuthorId(UUID businessId, UUID authorId);

    /**
     * Finds all reviews for the specified business.
     *
     * @param businessId The UUID of the business.
     * @return A list of reviews for the business.
     */
    @EntityGraph(attributePaths = {"author"})
    List<BusinessReview> findByBusinessId(UUID businessId);

    /**
     * Finds a paginated list of reviews for the specified business.
     *
     * @param businessId The UUID of the business.
     * @param pageable Pagination and sorting information.
     * @return A page of reviews for the business.
     */
    @EntityGraph(attributePaths = {"author"})
    Page<BusinessReview> findByBusinessId(UUID businessId, Pageable pageable);

    /**
     * Finds all reviews for the specified business ordered by creation date descending.
     *
     * @param businessId The UUID of the business.
     * @return A list of reviews ordered newest first.
     */
    @EntityGraph(attributePaths = {"author"})
    List<BusinessReview> findByBusinessIdOrderByCreatedAtDesc(UUID businessId);

    /**
     * Finds all reviews submitted by the specified author.
     *
     * @param authorId The UUID of the authoring user.
     * @return A list of reviews submitted by the author.
     */
    List<BusinessReview> findByAuthorId(UUID authorId);

    /**
     * Finds a paginated list of reviews submitted by the specified author.
     *
     * @param authorId The UUID of the authoring user.
     * @param pageable Pagination and sorting information.
     * @return A page of reviews submitted by the author.
     */
    Page<BusinessReview> findByAuthorId(UUID authorId, Pageable pageable);

    /**
     * Finds all reviews submitted by the specified author ordered by creation date descending.
     *
     * @param authorId The UUID of the authoring user.
     * @return A list of reviews ordered newest first.
     */
    List<BusinessReview> findByAuthorIdOrderByCreatedAtDesc(UUID authorId);

    /**
     * Counts the total number of reviews submitted for the specified business.
     *
     * @param businessId The UUID of the business.
     * @return The count of reviews for the business.
     */
    long countByBusinessId(UUID businessId);

    /**
     * Aggregates review counts grouped by rating value (1 to 5) for a given business.
     *
     * @param businessId The UUID of the business.
     * @return A list of Object arrays where each row contains [rating (Integer), count (Long)].
     */
    @Query("SELECT r.rating, COUNT(r.id) FROM BusinessReview r WHERE r.business.id = :businessId GROUP BY r.rating")
    List<Object[]> countReviewsGroupedByRating(@Param("businessId") UUID businessId);
}

