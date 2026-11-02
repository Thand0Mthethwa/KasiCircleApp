package com.kasicircle.backend.users.entity;

/**
 * Defines the type of account for a KasiCircle user.
 * Kept separate from security {@link Role} (which governs authorizations).
 */
public enum AccountType {
    RESIDENT,
    WORKER,
    BUSINESS
}

