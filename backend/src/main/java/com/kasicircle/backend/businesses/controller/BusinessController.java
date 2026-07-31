package com.kasicircle.backend.businesses.controller;

import com.kasicircle.backend.businesses.dto.CreateBusinessRequest;
import com.kasicircle.backend.businesses.dto.BusinessResponse;
import com.kasicircle.backend.businesses.service.BusinessService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/businesses")
@RequiredArgsConstructor
public class BusinessController {

    private final BusinessService businessService;

    @PostMapping
    public ResponseEntity<BusinessResponse> createBusiness(@Valid @RequestBody CreateBusinessRequest request) {
        BusinessResponse response = businessService.createBusiness(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
}
