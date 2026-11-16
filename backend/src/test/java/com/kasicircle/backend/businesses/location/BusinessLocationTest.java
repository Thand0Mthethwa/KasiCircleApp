package com.kasicircle.backend.businesses.location;

import com.kasicircle.backend.businesses.controller.BusinessController;
import com.kasicircle.backend.businesses.domain.Business;
import com.kasicircle.backend.businesses.dto.BusinessLocationRequest;
import com.kasicircle.backend.businesses.mapper.BusinessMapper;
import com.kasicircle.backend.businesses.repository.BusinessRepository;
import com.kasicircle.backend.businesses.service.BusinessServiceImpl;
import com.kasicircle.backend.shared.exception.GlobalExceptionHandler;
import com.kasicircle.backend.users.entity.AccountType;
import com.kasicircle.backend.users.entity.User;
import com.kasicircle.backend.users.repository.UserRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

// Repository mocks only: database-write acceptance runs against guarded QA PostgreSQL.
class BusinessLocationTest {
    BusinessRepository businesses;
    UserRepository users;
    BusinessServiceImpl service;
    Business business;
    User owner;
    MockMvc mvc;
    String endpoint;
    @BeforeEach void setup() {
        businesses = mock(BusinessRepository.class);users = mock(UserRepository.class);
        owner = User.builder().id(UUID.randomUUID()).email("location-owner@example.test").firstName("QA").lastName("Owner").password("unused").accountType(AccountType.BUSINESS).build();
        business = Business.builder().id(UUID.randomUUID()).owner(owner).name("QA Business").description("Public description")
                .phoneNumber("+27821234567").email("qa@example.test").category("Retail").address("QA address").city("Soweto").province("Gauteng").build();
        when(users.findByEmail(owner.getEmail())).thenReturn(Optional.of(owner));
        when(businesses.findById(business.getId())).thenReturn(Optional.of(business));
        when(businesses.findForLocationUpdate(business.getId())).thenReturn(Optional.of(business));
        when(businesses.saveAndFlush(any())).thenAnswer(call -> call.getArgument(0));
        when(businesses.save(any())).thenAnswer(call -> call.getArgument(0));
        service = new BusinessServiceImpl(businesses, users, new BusinessMapper());
        mvc = MockMvcBuilders.standaloneSetup(new BusinessController(service)).setControllerAdvice(new GlobalExceptionHandler()).build();
        endpoint = "/api/businesses/" + business.getId() + "/location";
        authenticate(owner);
    }
    @AfterEach void cleanup() { SecurityContextHolder.clearContext(); }
    void authenticate(User user) {
        SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated(user.getEmail(), "unused", List.of()));
        when(users.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
    }
    void location(double latitude, double longitude, boolean published) { business.setLatitude(latitude);business.setLongitude(longitude);business.setLocationPublic(published); }
    @Test void existingBusinessesHaveNoCoordinatesAndNoConsent() throws Exception {
        mvc.perform(get(endpoint)).andExpect(status().isOk()).andExpect(jsonPath("$.latitude").isEmpty()).andExpect(jsonPath("$.longitude").isEmpty()).andExpect(jsonPath("$.locationPublic").value(false));
        assertNull(service.getBusinessById(business.getId()).latitude());assertFalse(business.isLocationPublic());
    }
    @Test void ownerCanSavePrivateDraftAndPublishHideAndRemoveIt() throws Exception {
        mvc.perform(put(endpoint).contentType("application/json").content("{\"latitude\":-25.72,\"longitude\":28.24,\"locationPublic\":false}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.latitude").value(-25.72)).andExpect(jsonPath("$.locationPublic").value(false));
        assertNull(service.getBusinessById(business.getId()).latitude());
        service.updateLocation(business.getId(), new BusinessLocationRequest(-25.72,28.24,true));
        assertEquals(-25.72,service.getBusinessById(business.getId()).latitude());
        service.updateLocation(business.getId(), new BusinessLocationRequest(-25.72,28.24,false));
        assertNull(service.getBusinessById(business.getId()).latitude());assertEquals(-25.72,service.getLocation(business.getId()).latitude());
        mvc.perform(delete(endpoint)).andExpect(status().isOk()).andExpect(jsonPath("$.latitude").isEmpty()).andExpect(jsonPath("$.locationPublic").value(false));
        mvc.perform(delete(endpoint)).andExpect(status().isOk());assertNull(business.getLongitude());
    }
    @ParameterizedTest @ValueSource(strings = {
            "{\"latitude\":91,\"longitude\":28,\"locationPublic\":true}",
            "{\"latitude\":-91,\"longitude\":28,\"locationPublic\":false}",
            "{\"latitude\":0,\"longitude\":181,\"locationPublic\":true}",
            "{\"latitude\":0,\"longitude\":-181,\"locationPublic\":false}",
            "{\"latitude\":null,\"longitude\":28,\"locationPublic\":false}",
            "{\"latitude\":25,\"longitude\":null,\"locationPublic\":false}",
            "{\"latitude\":null,\"longitude\":null,\"locationPublic\":true}",
            "{\"latitude\":25,\"longitude\":28}",
            "{\"latitude\":\"NaN\",\"longitude\":28,\"locationPublic\":true}",
            "{\"latitude\":0,\"longitude\":\"Infinity\",\"locationPublic\":false}",
            "{\"latitude\":\"-Infinity\",\"longitude\":28,\"locationPublic\":false}",
            "{\"latitude\":1e309,\"longitude\":28,\"locationPublic\":true}"})
    void invalidRequestsNeverChangeExistingLocation(String payload) throws Exception {
        location(-25.72,28.24,true);
        mvc.perform(put(endpoint).contentType("application/json").content(payload)).andExpect(status().isBadRequest());
        assertEquals(-25.72,business.getLatitude());assertTrue(business.isLocationPublic());verify(businesses,never()).saveAndFlush(any());
    }
    @Test void explicitZeroAndRangeEdgesAreValid() {
        service.updateLocation(business.getId(),new BusinessLocationRequest(0.0,0.0,true));assertEquals(0.0,business.getLatitude());
        service.updateLocation(business.getId(),new BusinessLocationRequest(-90.0,-180.0,true));assertEquals(-180.0,business.getLongitude());
        service.updateLocation(business.getId(),new BusinessLocationRequest(90.0,180.0,true));assertEquals(90.0,business.getLatitude());
    }
    @Test void unauthenticatedReadsAndWritesAreRejected() throws Exception {
        SecurityContextHolder.clearContext();
        mvc.perform(get(endpoint)).andExpect(status().isUnauthorized());
        mvc.perform(put(endpoint).contentType("application/json").content("{\"latitude\":0,\"longitude\":0,\"locationPublic\":true}")).andExpect(status().isUnauthorized());
        mvc.perform(delete(endpoint)).andExpect(status().isUnauthorized());
    }
    @ParameterizedTest @ValueSource(strings={"RESIDENT","WORKER","BUSINESS"})
    void everyNonOwnerIsDeniedPrivateReadsAndMutations(String type) throws Exception {
        location(-25.72,28.24,false);
        User other = User.builder().id(UUID.randomUUID()).email("other@example.test").accountType(AccountType.valueOf(type)).build();authenticate(other);
        MockHttpServletResponse response=mvc.perform(get(endpoint)).andExpect(status().isForbidden()).andExpect(jsonPath("$.latitude").doesNotExist()).andReturn().getResponse();
        assertFalse(response.getContentAsString().contains("-25.72"));
        mvc.perform(put(endpoint).contentType("application/json").content("{\"latitude\":0,\"longitude\":0,\"locationPublic\":true}")).andExpect(status().isForbidden());
        mvc.perform(delete(endpoint)).andExpect(status().isForbidden());assertEquals(-25.72,business.getLatitude());verify(businesses,never()).saveAndFlush(any());
    }
    @Test void publicDetailAndPageNeverExposeDraftOrInvalidCoordinates() throws Exception {
        location(-25.72,28.24,false);
        mvc.perform(get("/api/businesses/"+business.getId())).andExpect(status().isOk()).andExpect(jsonPath("$.latitude").isEmpty()).andExpect(jsonPath("$.longitude").isEmpty());
        when(businesses.findAll(any(org.springframework.data.jpa.domain.Specification.class),any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(business)));
        assertNull(service.getAllBusinesses("QA",null,"Soweto",PageRequest.of(0,8)).getContent().get(0).latitude());
        for(double invalid : new double[]{Double.NaN,Double.POSITIVE_INFINITY,Double.NEGATIVE_INFINITY,91}) {
            location(invalid,28.24,true);assertNull(new BusinessMapper().toBusinessResponse(business).latitude());assertNull(new BusinessMapper().toBusinessResponse(business).longitude());
        }
        location(-25.72,28.24,true);assertEquals(28.24,service.getAllBusinesses(null,null,null,PageRequest.of(0,8)).getContent().get(0).longitude());
    }
    @Test void ordinaryBusinessUpdatesFromOldClientsPreserveDraftAndPublication() throws Exception {
        for(boolean published : new boolean[]{false,true}) {
            location(-25.72,28.24,published);
            mvc.perform(put("/api/businesses/"+business.getId()).contentType("application/json").content("""
                    {"name":"Renamed QA Business","description":"Same listing updated", "phoneNumber":"+27821234567",
                    "email":"qa@example.test","category":"Retail","address":"Updated QA address","city":"Soweto","province":"Gauteng"}
                    """)).andExpect(status().isOk());
            assertEquals(-25.72,business.getLatitude());assertEquals(28.24,business.getLongitude());assertEquals(published,business.isLocationPublic());
        }
    }
}
