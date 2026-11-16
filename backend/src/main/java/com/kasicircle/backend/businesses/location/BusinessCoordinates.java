package com.kasicircle.backend.businesses.location;

public final class BusinessCoordinates {
    private BusinessCoordinates() { }
    public static boolean valid(Double latitude, Double longitude) {
        return latitude != null && longitude != null && Double.isFinite(latitude) && Double.isFinite(longitude)
                && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
    }
}
