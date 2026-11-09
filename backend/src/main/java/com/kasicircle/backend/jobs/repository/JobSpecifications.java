package com.kasicircle.backend.jobs.repository;

import com.kasicircle.backend.jobs.domain.Job;
import com.kasicircle.backend.jobs.domain.JobStatus;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

import java.util.Locale;

public final class JobSpecifications {

    private JobSpecifications() {
    }

    public static Specification<Job> withFilters(
            String search, String category, String city, JobStatus status
    ) {
        return (root, query, builder) -> {
            var predicates = builder.conjunction();
            if (search != null && !search.isBlank()) {
                var employer = root.join("employer", JoinType.LEFT);
                String keyword = contains(search);
                predicates = builder.and(predicates, builder.or(
                        builder.like(builder.lower(root.get("title")), keyword),
                        builder.like(builder.lower(root.get("description")), keyword),
                        builder.like(builder.lower(employer.get("firstName")), keyword),
                        builder.like(builder.lower(employer.get("lastName")), keyword)
                ));
            }
            if (category != null && !category.isBlank()) {
                predicates = builder.and(predicates,
                        builder.equal(builder.lower(root.get("category")), category.trim().toLowerCase(Locale.ROOT)));
            }
            if (city != null && !city.isBlank()) {
                predicates = builder.and(predicates,
                        builder.like(builder.lower(root.get("city")), contains(city)));
            }
            if (status != null) {
                predicates = builder.and(predicates, builder.equal(root.get("status"), status));
            }
            return predicates;
        };
    }

    private static String contains(String value) {
        return "%" + value.trim().toLowerCase(Locale.ROOT) + "%";
    }
}
