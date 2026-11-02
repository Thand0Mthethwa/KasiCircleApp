package com.kasicircle.backend.businesses.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.server.ResponseStatusException;

@ResponseStatus(HttpStatus.CONFLICT)
public class BusinessAlreadyExistsException extends ResponseStatusException {
    public BusinessAlreadyExistsException(String message) {
        super(HttpStatus.CONFLICT, message);
    }
}

