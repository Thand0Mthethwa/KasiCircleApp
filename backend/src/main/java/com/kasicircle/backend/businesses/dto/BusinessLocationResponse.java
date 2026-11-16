package com.kasicircle.backend.businesses.dto;

// This DTO is returned only after BUSINESS account and ownership checks.
public record BusinessLocationResponse(Double latitude, Double longitude, boolean locationPublic) { }
