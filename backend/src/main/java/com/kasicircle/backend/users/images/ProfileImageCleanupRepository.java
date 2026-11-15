package com.kasicircle.backend.users.images;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ProfileImageCleanupRepository extends JpaRepository<ProfileImageCleanup, UUID> {
    List<ProfileImageCleanup> findTop20ByOrderByCreatedAtAsc();
}
