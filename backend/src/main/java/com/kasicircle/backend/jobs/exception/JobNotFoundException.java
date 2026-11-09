package com.kasicircle.backend.jobs.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public class JobNotFoundException extends ResponseStatusException {
    public JobNotFoundException(String message) {
        super(HttpStatus.NOT_FOUND, message);
    }
}
