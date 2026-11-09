package com.kasicircle.backend.workers.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public class WorkerProfileNotFoundException extends ResponseStatusException {

    public WorkerProfileNotFoundException(String message) {
        super(HttpStatus.NOT_FOUND, message);
    }
}
