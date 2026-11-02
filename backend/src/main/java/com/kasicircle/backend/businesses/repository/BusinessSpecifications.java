package com.kasicircle.backend.businesses.repository;

import com.kasicircle.backend.businesses.domain.Business;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public final class BusinessSpecifications {

    private BusinessSpecifications() {
    }

    /**
     * Constructs a Specification to filter businesses by search term (name), category, and city.
     * All filters are optional and case-insensitive.
     *
     * @param search Search keyword matching against business name.
     * @param category Exact or case-insensitive category match.
     * @param city Exact or case-insensitive city/township match.
     * @return Specification for Business queries.
     */
    public static Specification<Business> withFilters(String search, String category, String city) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("name")), "%" + search.trim().toLowerCase() + "%"));
            }

            if (category != null && !category.trim().isEmpty()) {
                predicates.add(cb.equal(cb.lower(root.get("category")), category.trim().toLowerCase()));
            }

            if (city != null && !city.trim().isEmpty()) {
                predicates.add(cb.equal(cb.lower(root.get("city")), city.trim().toLowerCase()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}

