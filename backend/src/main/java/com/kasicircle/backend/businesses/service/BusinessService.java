package com.kasicircle.backend.businesses.service;

import com.kasicircle.backend.businesses.dto.CreateBusinessRequest;
import com.kasicircle.backend.businesses.dto.BusinessResponse;

public interface BusinessService {
    BusinessResponse createBusiness(CreateBusinessRequest request);
}
