package com.kasicircle.backend.businesses.repository;

import com.kasicircle.backend.businesses.domain.BusinessImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BusinessImageRepository extends JpaRepository<BusinessImage, UUID> {

    List<BusinessImage> findByBusinessIdOrderByIsCoverDescSortOrderAscCreatedAtDesc(UUID businessId);

    List<BusinessImage> findByBusinessIdOrderByCreatedAtAsc(UUID businessId);

    List<BusinessImage> findByBusinessId(UUID businessId);

    Optional<BusinessImage> findByIdAndBusinessId(UUID id, UUID businessId);

    long countByBusinessId(UUID businessId);

    Optional<BusinessImage> findByBusinessIdAndIsCoverTrue(UUID businessId);

    @Query("SELECT bi.imageUrl FROM BusinessImage bi WHERE bi.business.id = :businessId AND bi.isCover = true")
    Optional<String> findCoverImageUrlByBusinessId(@Param("businessId") UUID businessId);

    @Query("SELECT bi.business.id, bi.imageUrl FROM BusinessImage bi WHERE bi.business.id IN :businessIds AND bi.isCover = true")
    List<Object[]> findCoverImageUrlsByBusinessIds(@Param("businessIds") Collection<UUID> businessIds);

    @Modifying
    @Query("UPDATE BusinessImage bi SET bi.isCover = false WHERE bi.business.id = :businessId")
    int unsetCoverForBusiness(@Param("businessId") UUID businessId);
}

