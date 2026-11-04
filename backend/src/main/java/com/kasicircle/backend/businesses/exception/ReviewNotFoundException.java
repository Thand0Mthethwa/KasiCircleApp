package com.kasicircle.backend.businesses.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * Exception thrown when a review cannot be found.
 * Maps to HTTP 404 Not Found.
 */
@ResponseStatus(HttpStatus.NOT_FOUND)
public class ReviewNotFoundException extends ResponseStatusException {

    public ReviewNotFoundException(String message) {
        super(HttpStatus.NOT_FOUND, message);
    }
}

