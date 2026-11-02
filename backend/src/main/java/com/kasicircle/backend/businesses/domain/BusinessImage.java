package com.kasicircle.backend.businesses.domain;

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
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "business_images", indexes = {
        @Index(name = "idx_business_images_business_id", columnList = "business_id")
})
public class BusinessImage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "business_id", nullable = false)
    private Business business;

    @NotBlank
    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    @NotBlank
    @Column(name = "storage_id", nullable = false, length = 255)
    private String storageId;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @NotBlank
    @Column(name = "content_type", nullable = false, length = 50)
    private String contentType;

    @NotNull
    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @NotNull
    @Column(name = "is_cover", nullable = false)
    private Boolean isCover = false;

    @NotNull
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public BusinessImage() {
    }

    public BusinessImage(UUID id, Business business, String imageUrl, String storageId, String fileName,
                         String contentType, Long fileSize, Boolean isCover, Integer sortOrder, Instant createdAt) {
        this.id = id;
        this.business = business;
        this.imageUrl = imageUrl;
        this.storageId = storageId;
        this.fileName = fileName;
        this.contentType = contentType;
        this.fileSize = fileSize;
        this.isCover = isCover != null ? isCover : false;
        this.sortOrder = sortOrder != null ? sortOrder : 0;
        this.createdAt = createdAt;
    }

    public static BusinessImageBuilder builder() {
        return new BusinessImageBuilder();
    }

    public static class BusinessImageBuilder {
        private UUID id;
        private Business business;
        private String imageUrl;
        private String storageId;
        private String fileName;
        private String contentType;
        private Long fileSize;
        private Boolean isCover = false;
        private Integer sortOrder = 0;
        private Instant createdAt;

        public BusinessImageBuilder id(UUID id) {
            this.id = id;
            return this;
        }

        public BusinessImageBuilder business(Business business) {
            this.business = business;
            return this;
        }

        public BusinessImageBuilder imageUrl(String imageUrl) {
            this.imageUrl = imageUrl;
            return this;
        }

        public BusinessImageBuilder storageId(String storageId) {
            this.storageId = storageId;
            return this;
        }

        public BusinessImageBuilder fileName(String fileName) {
            this.fileName = fileName;
            return this;
        }

        public BusinessImageBuilder contentType(String contentType) {
            this.contentType = contentType;
            return this;
        }

        public BusinessImageBuilder fileSize(Long fileSize) {
            this.fileSize = fileSize;
            return this;
        }

        public BusinessImageBuilder isCover(Boolean isCover) {
            this.isCover = isCover;
            return this;
        }

        public BusinessImageBuilder sortOrder(Integer sortOrder) {
            this.sortOrder = sortOrder;
            return this;
        }

        public BusinessImageBuilder createdAt(Instant createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public BusinessImage build() {
            return new BusinessImage(id, business, imageUrl, storageId, fileName, contentType, fileSize, isCover, sortOrder, createdAt);
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

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getStorageId() {
        return storageId;
    }

    public void setStorageId(String storageId) {
        this.storageId = storageId;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public Boolean getIsCover() {
        return isCover;
    }

    public void setIsCover(Boolean isCover) {
        this.isCover = isCover != null ? isCover : false;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder != null ? sortOrder : 0;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof BusinessImage that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}

