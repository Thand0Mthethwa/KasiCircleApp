package com.kasicircle.backend.businesses.domain;

import com.kasicircle.backend.users.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.Check;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * Persistent customer rating and review for a KasiCircle business.
 */
@Entity
@Table(
        name = "business_reviews",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_business_reviews_business_user",
                        columnNames = {"business_id", "user_id"}
                )
        },
        indexes = {
                @Index(name = "idx_business_reviews_business_id", columnList = "business_id"),
                @Index(name = "idx_business_reviews_user_id", columnList = "user_id")
        }
)
public class BusinessReview {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "business_id", nullable = false)
    private Business business;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User author;

    @NotNull
    @Min(1)
    @Max(5)
    @Check(constraints = "rating >= 1 AND rating <= 5")
    @Column(nullable = false)
    private Integer rating;

    @Column(length = 1000)
    private String comment;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public BusinessReview() {
    }

    public BusinessReview(UUID id, Business business, User author, Integer rating, String comment, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.business = business;
        this.author = author;
        this.rating = rating;
        this.comment = comment;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static BusinessReviewBuilder builder() {
        return new BusinessReviewBuilder();
    }

    public static class BusinessReviewBuilder {
        private UUID id;
        private Business business;
        private User author;
        private Integer rating;
        private String comment;
        private Instant createdAt;
        private Instant updatedAt;

        BusinessReviewBuilder() {
        }

        public BusinessReviewBuilder id(UUID id) {
            this.id = id;
            return this;
        }

        public BusinessReviewBuilder business(Business business) {
            this.business = business;
            return this;
        }

        public BusinessReviewBuilder author(User author) {
            this.author = author;
            return this;
        }

        public BusinessReviewBuilder rating(Integer rating) {
            this.rating = rating;
            return this;
        }

        public BusinessReviewBuilder comment(String comment) {
            this.comment = comment;
            return this;
        }

        public BusinessReviewBuilder createdAt(Instant createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public BusinessReviewBuilder updatedAt(Instant updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public BusinessReview build() {
            return new BusinessReview(id, business, author, rating, comment, createdAt, updatedAt);
        }
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Business getBusiness() {
        return business;
    }

    public void setBusiness(Business business) {
        this.business = business;
    }

    public User getAuthor() {
        return author;
    }

    public void setAuthor(User author) {
        this.author = author;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        BusinessReview that = (BusinessReview) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "BusinessReview{" +
                "id=" + id +
                ", rating=" + rating +
                ", comment='" + comment + '\'' +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }
}
