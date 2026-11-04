package com.kasicircle.backend.businesses.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * Exception thrown when a user attempts to submit multiple reviews for the same business listing.
 * Maps to HTTP 409 Conflict.
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class ReviewAlreadyExistsException extends ResponseStatusException {

    public ReviewAlreadyExistsException(String message) {
        super(HttpStatus.CONFLICT, message);
    }
}

