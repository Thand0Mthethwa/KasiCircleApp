package com.kasicircle.backend.businesses.dto;

import jakarta.validation.constraints.NotNull;

public record BusinessLocationRequest(Double latitude, Double longitude,
        @NotNull(message = "Choose whether to publish this location.") Boolean locationPublic) { }
