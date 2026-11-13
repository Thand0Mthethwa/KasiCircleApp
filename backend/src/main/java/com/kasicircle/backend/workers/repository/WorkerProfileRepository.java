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

    // PostgreSQL must receive typed text parameters even when optional filters are null.
    @EntityGraph(attributePaths = "owner")
    @Query(value = """
            select distinct p from WorkerProfile p
            join fetch p.owner owner
            where (cast(:search as string) is null
                or lower(p.headline) like lower(concat('%', cast(:search as string), '%'))
                or lower(p.bio) like lower(concat('%', cast(:search as string), '%'))
                or lower(owner.firstName) like lower(concat('%', cast(:search as string), '%'))
                or lower(owner.lastName) like lower(concat('%', cast(:search as string), '%')))
              and (cast(:city as string) is null or lower(p.city) like lower(concat('%', cast(:city as string), '%')))
              and (cast(:category as string) is null or exists (
                  select c from WorkerProfile profile join profile.serviceCategories c
                  where profile = p and lower(c) = lower(cast(:category as string))))
              and (cast(:skill as string) is null or exists (
                  select s from WorkerProfile profile join profile.skills s
                  where profile = p and lower(s) like lower(concat('%', cast(:skill as string), '%'))))
            """,
            countQuery = """
            select count(p) from WorkerProfile p
            join p.owner owner
            where (cast(:search as string) is null
                or lower(p.headline) like lower(concat('%', cast(:search as string), '%'))
                or lower(p.bio) like lower(concat('%', cast(:search as string), '%'))
                or lower(owner.firstName) like lower(concat('%', cast(:search as string), '%'))
                or lower(owner.lastName) like lower(concat('%', cast(:search as string), '%')))
              and (cast(:city as string) is null or lower(p.city) like lower(concat('%', cast(:city as string), '%')))
              and (cast(:category as string) is null or exists (
                  select c from WorkerProfile profile join profile.serviceCategories c
                  where profile = p and lower(c) = lower(cast(:category as string))))
              and (cast(:skill as string) is null or exists (
                  select s from WorkerProfile profile join profile.skills s
                  where profile = p and lower(s) like lower(concat('%', cast(:skill as string), '%'))))
            """)
    Page<WorkerProfile> searchPublicProfiles(
            @Param("search") String search,
            @Param("category") String category,
            @Param("skill") String skill,
            @Param("city") String city,
            Pageable pageable
    );
}
