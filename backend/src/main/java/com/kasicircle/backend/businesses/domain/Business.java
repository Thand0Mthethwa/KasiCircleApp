package com.kasicircle.backend.businesses.domain;

import com.kasicircle.backend.users.entity.User;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "businesses")
public class Business {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotBlank
    private String name;

    @NotBlank
    private String description;

    @NotBlank
    private String phoneNumber;

    @Email
    @NotBlank
    private String email;

    @NotBlank
    private String category;

    @NotBlank
    private String address;

    @NotBlank
    private String city;

    @NotBlank
    private String province;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @CreationTimestamp
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;

    public Business() {
    }

    public Business(UUID id, String name, String description, String phoneNumber, String email, String category, String address, String city, String province, User owner, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.phoneNumber = phoneNumber;
        this.email = email;
        this.category = category;
        this.address = address;
        this.city = city;
        this.province = province;
        this.owner = owner;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static BusinessBuilder builder() {
        return new BusinessBuilder();
    }

    public static class BusinessBuilder {
        private UUID id;
        private String name;
        private String description;
        private String phoneNumber;
        private String email;
        private String category;
        private String address;
        private String city;
        private String province;
        private User owner;
        private Instant createdAt;
        private Instant updatedAt;

        BusinessBuilder() {
        }

        public BusinessBuilder id(UUID id) {
            this.id = id;
            return this;
        }

        public BusinessBuilder name(String name) {
            this.name = name;
            return this;
        }

        public BusinessBuilder description(String description) {
            this.description = description;
            return this;
        }

        public BusinessBuilder phoneNumber(String phoneNumber) {
            this.phoneNumber = phoneNumber;
            return this;
        }

        public BusinessBuilder email(String email) {
            this.email = email;
            return this;
        }

        public BusinessBuilder category(String category) {
            this.category = category;
            return this;
        }

        public BusinessBuilder address(String address) {
            this.address = address;
            return this;
        }

        public BusinessBuilder city(String city) {
            this.city = city;
            return this;
        }

        public BusinessBuilder province(String province) {
            this.province = province;
            return this;
        }

        public BusinessBuilder owner(User owner) {
            this.owner = owner;
            return this;
        }

        public BusinessBuilder createdAt(Instant createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public BusinessBuilder updatedAt(Instant updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public Business build() {
            return new Business(id, name, description, phoneNumber, email, category, address, city, province, owner, createdAt, updatedAt);
        }
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getProvince() {
        return province;
    }

    public void setProvince(String province) {
        this.province = province;
    }

    public User getOwner() {
        return owner;
    }

    public void setOwner(User owner) {
        this.owner = owner;
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
        Business business = (Business) o;
        return Objects.equals(id, business.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
