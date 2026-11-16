package com.kasicircle.backend.places;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;
import java.time.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.http.HttpStatus.*;

class PlaceSearchServiceTest {
    final RestClient.Builder builder = RestClient.builder().baseUrl("https://api.geoapify.com");
    final MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
    final Clock clock = Clock.fixed(Instant.parse("2026-11-16T00:00:00Z"), ZoneOffset.UTC);
    PlaceSearchService service(String key) { return new PlaceSearchService(key, new ObjectMapper(), builder.build(), clock); }
    @Test void disabledAndInvalidQueriesNeverCallProvider() {
        var disabled = service("");assertFalse(disabled.enabled());
        assertEquals(503, assertThrows(ResponseStatusException.class, () -> disabled.search("Daveyton", "owner")).getStatusCode().value());
        var enabled = service("test-only-key");
        for (String q : new String[]{"ab", "a".repeat(121), "Dave\nyton"})
            assertEquals(400, assertThrows(ResponseStatusException.class, () -> enabled.search(q, "owner")).getStatusCode().value());
        server.verify();
    }
    @Test void southAfricanQueryIsBoundedAndResponseContainsOnlySafeFields() {
        server.expect(requestTo(org.hamcrest.Matchers.allOf(org.hamcrest.Matchers.containsString("/v1/geocode/search?"), org.hamcrest.Matchers.containsString("text=Daveyton"), org.hamcrest.Matchers.containsString("filter=countrycode:za"), org.hamcrest.Matchers.containsString("limit=5"))))
            .andExpect(headerDoesNotExist("Authorization"))
            .andRespond(withSuccess("""
            {"results":[{"name":"Daveyton","formatted":"Daveyton, South Africa","lat":-26.15,"lon":28.42,"country_code":"za","datasource":{"attribution":"© OpenStreetMap contributors"},"apiKey":"MUST NOT LEAK"},
            {"formatted":"Bad","lat":91,"lon":0,"country_code":"za"},{"formatted":"Foreign","lat":0,"lon":0,"country_code":"us"}]}
            """, APPLICATION_JSON));
        var result = service("test-only-key").search(" Daveyton ", "owner");assertEquals(1, result.places().size());
        assertEquals("Daveyton", result.places().getFirst().name());assertFalse(result.toString().contains("MUST NOT LEAK"));server.verify();
    }
    @Test void emptyResultsAreHonest() {
        server.expect(anything()).andRespond(withSuccess("{\"results\":[]}", APPLICATION_JSON));
        assertTrue(service("test").search("Benoni", "owner").places().isEmpty());server.verify();
    }
    @Test void providerFailuresNeverExposeSecretsOrBodies() {
        for (var status : new org.springframework.http.HttpStatus[]{TOO_MANY_REQUESTS, FORBIDDEN, BAD_GATEWAY}) {
            server.reset();server.expect(anything()).andRespond(withStatus(status).body("secret-provider-error"));
            var error = assertThrows(ResponseStatusException.class, () -> service("test-only-key").search("Daveyton", "owner"));
            assertEquals(status == TOO_MANY_REQUESTS ? 429 : 503, error.getStatusCode().value());
            assertFalse(error.toString().contains("secret-provider-error"));assertFalse(error.toString().contains("test-only-key"));server.verify();
        }
    }
    @Test void malformedOversizedAndConnectionFailuresAreSanitized() {
        for (String body : new String[]{"bad", "{}", "x".repeat(65537)}) {
            server.reset();server.expect(anything()).andRespond(withSuccess(body, APPLICATION_JSON));
            assertEquals(503, assertThrows(ResponseStatusException.class, () -> service("test").search("Benoni", "owner")).getStatusCode().value());server.verify();
        }
        server.reset();server.expect(anything()).andRespond(withException(new java.net.SocketTimeoutException("secret URI")));
        assertEquals(503, assertThrows(ResponseStatusException.class, () -> service("test").search("Benoni", "owner")).getStatusCode().value());server.verify();
    }
    @Test void globalRateLimitRejectsBeforeThirdProviderRequest() {
        server.expect(org.springframework.test.web.client.ExpectedCount.times(2), anything()).andRespond(withSuccess("{\"results\":[]}", APPLICATION_JSON));
        var service = service("test");service.search("Daveyton", "a");service.search("Benoni", "b");
        assertEquals(429, assertThrows(ResponseStatusException.class, () -> service.search("Soweto", "c")).getStatusCode().value());server.verify();
    }
    @Test void perOwnerQuotaExpiresAndDoesNotBlockAnotherOwner() {
        var time = new java.util.concurrent.atomic.AtomicLong(0);
        Clock moving = new Clock() {
            public java.time.ZoneId getZone() { return ZoneOffset.UTC; }
            public Clock withZone(java.time.ZoneId zone) { return this; }
            public Instant instant() { return Instant.ofEpochMilli(time.get()); }
        };
        server.expect(org.springframework.test.web.client.ExpectedCount.times(12), anything()).andRespond(withSuccess("{\"results\":[]}", APPLICATION_JSON));
        var service = new PlaceSearchService("test", new ObjectMapper(), builder.build(), moving);
        for (int i = 0; i < 10; i++) { time.set(i * 1000L);service.search("Daveyton", "owner"); }
        time.set(11000);assertEquals(429, assertThrows(ResponseStatusException.class, () -> service.search("Daveyton", "owner")).getStatusCode().value());
        service.search("Benoni", "another-owner");time.set(60000);service.search("Daveyton", "owner");server.verify();
    }
    @Test void queryDelimitersAreEncodedAndAtMostFivePlacesAreReturned() {
        String item = "{\"formatted\":\"Daveyton\",\"lat\":-26.15,\"lon\":28.42,\"country_code\":\"za\"}";
        server.expect(request -> assertTrue(request.getURI().getRawQuery().contains("text=Daveyton%20%26%20Benoni")))
            .andRespond(withSuccess("{\"results\":[" + String.join(",", java.util.Collections.nCopies(7, item)) + "]}", APPLICATION_JSON));
        assertEquals(5, service("test").search("Daveyton & Benoni", "owner").places().size());server.verify();
    }

}
