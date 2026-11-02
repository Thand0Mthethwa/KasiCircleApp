package com.kasicircle.backend.businesses.exception;

public class ImageQuotaExceededException extends RuntimeException {

    public ImageQuotaExceededException(String message) {
        super(message);
    }
}

