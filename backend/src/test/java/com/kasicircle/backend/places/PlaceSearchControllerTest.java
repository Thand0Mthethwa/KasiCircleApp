package com.kasicircle.backend.places;

import com.kasicircle.backend.users.entity.AccountType;
import com.kasicircle.backend.users.entity.User;
import com.kasicircle.backend.users.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PlaceSearchControllerTest {
    @Autowired MockMvc mvc;
    @MockitoBean PlaceSearchService service;
    @MockitoBean UserRepository users;
    void account(AccountType type) {
        var user = new User();user.setId(UUID.randomUUID());user.setEmail("owner@example.test");user.setAccountType(type);
        when(users.findByEmail("owner@example.test")).thenReturn(Optional.of(user));
    }
    @Test void anonymousCannotReadStatusOrSearch() throws Exception {
        mvc.perform(get("/api/places/status")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/places/search").param("q", "Daveyton")).andExpect(status().isUnauthorized());
        verifyNoInteractions(service);
    }
    @Test @WithMockUser(username="owner@example.test") void businessCanReadAvailabilityAndSearch() throws Exception {
        account(AccountType.BUSINESS);when(service.enabled()).thenReturn(true);
        when(service.search(eq("Daveyton"), anyString())).thenReturn(new PlaceSearchService.Results(List.of(new PlaceSearchService.Place("Daveyton", "Daveyton, South Africa", -26.15, 28.42, "© OpenStreetMap contributors"))));
        mvc.perform(get("/api/places/status")).andExpect(status().isOk()).andExpect(header().string("Cache-Control", "no-store")).andExpect(jsonPath("$.enabled").value(true)).andExpect(jsonPath("$.apiKey").doesNotExist());
        mvc.perform(get("/api/places/search").param("q", "Daveyton")).andExpect(status().isOk()).andExpect(jsonPath("$.places[0].name").value("Daveyton"));
    }
    @Test @WithMockUser(username="owner@example.test") void workersResidentsAndMissingAccountsCannotSpendProviderCredits() throws Exception {
        for (var type : new AccountType[]{AccountType.WORKER, AccountType.RESIDENT}) {
            account(type);mvc.perform(get("/api/places/status")).andExpect(status().isForbidden());
            mvc.perform(get("/api/places/search").param("q", "Benoni")).andExpect(status().isForbidden());
        }
        when(users.findByEmail("owner@example.test")).thenReturn(Optional.empty());
        mvc.perform(get("/api/places/search").param("q", "Benoni")).andExpect(status().isForbidden());verifyNoInteractions(service);
    }
}
