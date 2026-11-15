package com.kasicircle.backend.users.repository;

import com.kasicircle.backend.users.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select u from User u where u.id = :id")
    Optional<User> findForImageUpdate(@org.springframework.data.repository.query.Param("id") UUID id);

    boolean existsByProfileImagePublicId(String publicId);

    boolean existsByEmail(String email);

    Optional<User> findByEmail(String email);
}
