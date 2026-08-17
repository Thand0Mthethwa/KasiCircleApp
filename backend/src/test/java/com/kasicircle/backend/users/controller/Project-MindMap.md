# KasiCircle Backend Architecture

This document provides a comprehensive visual overview of the KasiCircle backend architecture, request flows, and project roadmap using Mermaid diagrams. It is intended to help developers quickly understand the system's design and components.

## Table of Contents
1.  [High-Level Architecture](#1-high-level-architecture)
2.  [Package Structure](#2-package-structure)
3.  [Implemented Features](#3-implemented-features)
4.  [Project Sprint Roadmap](#4-project-sprint-roadmap)
5.  [Typical Request Flow](#5-typical-request-flow)
6.  [Authentication Flow](#6-authentication-flow)
7.  [Security Architecture](#7-security-architecture)
8.  [Database Relationships](#8-database-relationships)

---

## 1. High-Level Architecture

This mind map shows the major functional and technical components of the KasiCircle backend.

```mermaid
mindmap
  root((KasiCircle Backend))
    (Authentication)
      ::icon(fa fa-user-shield)
      (Register)
      (Login)
      (JWT Generation & Validation)
      (Password Encryption)
    (Users)
      ::icon(fa fa-users)
      (View Profile)
      (Update Profile)
      (Change Password)
    (Businesses)
      ::icon(fa fa-store)
      (Create Business Profile)
      (View Business Profile)
      (Update Business Profile)
    (Jobs)
      ::icon(fa fa-briefcase)
      (Post Job)
      (Search Jobs)
      (Apply for Job)
    (Workers)
      ::icon(fa fa-user-cog)
      (Create Worker Profile)
      (Search for Workers)
    (Messaging)
      ::icon(fa fa-comments)
      (Real-time Chat)
    (Reviews)
      ::icon(fa fa-star)
      (Leave Review)
      (View Reviews)
    (Notifications)
      ::icon(fa fa-bell)
      (Push & In-App)
    (Security)
      ::icon(fa fa-lock)
      (Spring Security)
      (JWT Filter)
      (CORS Configuration)
      (Role-Based Access)
    (Database)
      ::icon(fa fa-database)
      (PostgreSQL)
      (JPA / Hibernate)
      (Repositories)
    (Configuration)
      ::icon(fa fa-cogs)
      (application.properties)
      (Environment Variables)
    (Testing)
      ::icon(fa fa-vial)
      (JUnit 5)
      (Mockito)
      (MockMvc)
    (Documentation)
      ::icon(fa fa-file-alt)
      (API Docs)
      (Postman Collections)
      (READMEs)
```

---

## 2. Package Structure

The project follows a feature-oriented package structure to promote modularity and separation of concerns.

```mermaid
graph TD
    subgraph com.kasicircle.backend
        A(auth)
        B(config)
        C(security)
        D(shared)
        E(users)
        F(businesses)
        G(jobs)
        H(workers)
    end

    subgraph shared
        D1(exception)
        D2(validation)
    end

    subgraph users
        E1(controller)
        E2(dto)
        E3(entity)
        E4(exception)
        E5(repository)
        E6(service)
    end

    D --> D1
    D --> D2
    E --> E1 & E2 & E3 & E4 & E5 & E6

    style A fill:#eee,stroke:#333,stroke-width:2px
    style B fill:#eee,stroke:#333,stroke-width:2px
    style C fill:#eee,stroke:#333,stroke-width:2px
    style D fill:#eee,stroke:#333,stroke-width:2px
    style E fill:#eee,stroke:#333,stroke-width:2px
    style F fill:#eee,stroke:#333,stroke-width:2px
    style G fill:#eee,stroke:#333,stroke-width:2px
    style H fill:#eee,stroke:#333,stroke-width:2px
```

---

## 3. Implemented Features

This diagram tracks the features that are complete and integrated into the application.

```mermaid
mindmap
  root((Implemented Features))
    (Authentication)
      (✔ Register User)
      (✔ Login User)
      (✔ JWT Generation)
    (Users)
      (✔ View Authenticated User Profile)
      (✔ Update Authenticated User Profile)
      (✔ Change Authenticated User Password)
    (Businesses)
      (✔ Create Business Profile)
    (Security)
      (✔ Spring Security Configuration)
      (✔ BCrypt Password Hashing)
      (✔ JWT Authentication Filter)
      (✔ Role-Based Authorities)
      (✔ Custom UserDetailsService)
    (Database)
      (✔ PostgreSQL Integration)
      (✔ User Entity & Repository)
      (✔ Business Entity & Repository)
    (Validation)
      (✔ DTO-level validation)
      (✔ Custom @StrongPassword validator)
    (Testing)
      (✔ Unit & Integration Tests for Users module)
```

---

## 4. Project Sprint Roadmap

This roadmap outlines completed and planned work, organized by sprints.

```mermaid
mindmap
  root((Project Roadmap))
    (Sprint 1: Authentication ✔)
      (Register)
      (Login)
    (Sprint 2: Users ✔)
      (View/Update Profile)
      (Change Password)
    (Sprint 3: Businesses ✔)
      (Create Business Profile)
    (Sprint 4: Jobs 🚧)
    (Sprint 5: Workers 🚧)
    (Sprint 6: Messaging 🚧)
    (Sprint 7: Reviews 🚧)
    (Sprint 8: Notifications 🚧)
    (Sprint 9: Search 🚧)
    (Sprint 10: Admin 🚧)
    (Sprint 11: File Uploads 🚧)
    (Sprint 12: Production Prep 🚧)
```

---

## 5. Typical Request Flow

This flowchart illustrates the journey of an API request through the application's layers.

```mermaid
flowchart TD
    A[Client Request] --> B{JWT Filter};
    B -- Valid Token --> C[Controller];
    B -- Invalid Token --> G[401 Unauthorized];
    C -- Request DTO --> D[Service];
    D -- Entity --> E[Repository];
    E -- SQL --> F[PostgreSQL Database];
    F -- Result Set --> E;
    E -- Entity --> D;
    D -- Response DTO --> C;
    C -- JSON Response --> A;
```

---

## 6. Authentication Flow

This diagram details the two primary authentication processes: user registration and login.

```mermaid
graph TD
    subgraph Registration
        A[1. Client sends Register Request] --> B{2. Validate DTO};
        B -- Valid --> C[3. Encrypt Password with BCrypt];
        C --> D[4. Save User to Database];
        D --> E[5. Generate JWT];
        E --> F[6. Return JWT to Client];
        B -- Invalid --> G[400 Bad Request];
    end

    subgraph Login & Authenticated Request
        H[1. Client sends Login Request] --> I{2. Validate Credentials};
        I -- Valid --> J[3. Generate JWT];
        J --> K[4. Client stores JWT];
        K --> L[5. Client sends request with 'Authorization: Bearer JWT'];
        L --> M[6. JwtAuthenticationFilter validates token];
        M --> N[7. SecurityContext is populated];
        N --> O[8. Controller action is executed];
    end
```

---

## 7. Security Architecture

This mind map breaks down the key components of the Spring Security implementation.

```mermaid
mindmap
  root((Spring Security))
    (SecurityFilterChain)
      (CORS Configuration)
      (CSRF Disabled for stateless API)
      (Session Management: STATELESS)
      (Endpoint Authorization Rules)
    (JwtAuthenticationFilter)
      ::icon(fa fa-filter)
      (Extracts token from Header)
      (Validates token signature & expiration)
      (Loads UserDetails)
      (Populates SecurityContextHolder)
    (AuthenticationProvider)
      (Uses UserDetailsService)
      (Uses PasswordEncoder)
    (UserDetailsService)
      (Loads user data from Repository)
    (PasswordEncoder)
      (BCrypt implementation)
    (SecurityContextHolder)
      (Holds Authentication object for current thread)
```

---

## 8. Database Relationships

This diagram shows the relationships between the core database entities.

```mermaid
mindmap
  root((Entities))
    (User)
      (owns) --> (Business)
      (creates) --> (Job)
      (is a) --> (Worker)
      (sends/receives) --> (Message)
      (writes/receives) --> (Review)
    (Business)
      (posts) --> (Job)
      (receives) --> (Review)
    (Job)
      (has) --> (Application 🚧)
    (Worker)
      (receives) --> (Review)

    style User fill:#f9f,stroke:#333,stroke-width:2px
    style Business fill:#ccf,stroke:#333,stroke-width:2px
    style Job fill:#cfc,stroke:#333,stroke-width:2px
    style Worker fill:#ffc,stroke:#333,stroke-width:2px
    style Message fill:#eee,stroke:#333,stroke-width:2px
    style Review fill:#eee,stroke:#333,stroke-width:2px
    style Application fill:#eee,stroke:#333,stroke-width:2px
```