package com.kasicircle.backend.workers.repository;

import com.kasicircle.backend.workers.domain.WorkerProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface WorkerProfileRepository extends JpaRepository<WorkerProfile, UUID> {

    boolean existsByOwnerId(UUID ownerId);

    @EntityGraph(attributePaths = "owner")
    Optional<WorkerProfile> findByOwnerId(UUID ownerId);

    @EntityGraph(attributePaths = "owner")
    @Query(value = """
            select distinct p from WorkerProfile p
            join fetch p.owner owner
            where (:search is null
                or lower(p.headline) like lower(concat('%', :search, '%'))
                or lower(p.bio) like lower(concat('%', :search, '%'))
                or lower(owner.firstName) like lower(concat('%', :search, '%'))
                or lower(owner.lastName) like lower(concat('%', :search, '%')))
              and (:city is null or lower(p.city) like lower(concat('%', :city, '%')))
              and (:category is null or exists (
                  select c from WorkerProfile profile join profile.serviceCategories c
                  where profile = p and lower(c) = lower(:category)))
              and (:skill is null or exists (
                  select s from WorkerProfile profile join profile.skills s
                  where profile = p and lower(s) like lower(concat('%', :skill, '%'))))
            """,
            countQuery = """
            select count(p) from WorkerProfile p
            join p.owner owner
            where (:search is null
                or lower(p.headline) like lower(concat('%', :search, '%'))
                or lower(p.bio) like lower(concat('%', :search, '%'))
                or lower(owner.firstName) like lower(concat('%', :search, '%'))
                or lower(owner.lastName) like lower(concat('%', :search, '%')))
              and (:city is null or lower(p.city) like lower(concat('%', :city, '%')))
              and (:category is null or exists (
                  select c from WorkerProfile profile join profile.serviceCategories c
                  where profile = p and lower(c) = lower(:category)))
              and (:skill is null or exists (
                  select s from WorkerProfile profile join profile.skills s
                  where profile = p and lower(s) like lower(concat('%', :skill, '%'))))
            """)
    Page<WorkerProfile> searchPublicProfiles(
            @Param("search") String search,
            @Param("category") String category,
            @Param("skill") String skill,
            @Param("city") String city,
            Pageable pageable
    );
}
