package com.kasicircle.backend.users.images;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_profile_image_cleanup")
public class ProfileImageCleanup {
    @Id
    private UUID id;
    @Column(name = "public_id", nullable = false, unique = true, length = 255)
    private String publicId;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    @Column(nullable = false)
    private int attempts;

    protected ProfileImageCleanup() { }
    public ProfileImageCleanup(String publicId) { this.id = UUID.randomUUID(); this.publicId = publicId; this.createdAt = Instant.now(); }
    public String getPublicId() { return publicId; }
    public int getAttempts() { return attempts; }
    public void attempted() { attempts++; }
}
