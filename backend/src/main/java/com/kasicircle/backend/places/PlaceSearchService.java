package com.kasicircle.backend.places;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kasicircle.backend.businesses.location.BusinessCoordinates;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PlaceSearchService {
    public record Place(String name, String formattedAddress, double latitude, double longitude, String attribution) {}
    public record Results(List<Place> places) {}
    private final String key;
    private final RestClient client;
    private final ObjectMapper mapper;
    private final Clock clock;
    private final Map<String, Window> users = new HashMap<>();
    private long second = -1;
    private int globalCount;
    private record Window(long minute, int count) {}

    @Autowired
    public PlaceSearchService(@Value("${GEOAPIFY_API_KEY:}") String key, ObjectMapper mapper) {
        this(key, mapper, client(), Clock.systemUTC());
    }
    PlaceSearchService(String key, ObjectMapper mapper, RestClient client, Clock clock) {
        this.key = key.trim(); this.mapper = mapper; this.client = client; this.clock = clock;
    }
    private static RestClient client() {
        var http = java.net.http.HttpClient.newBuilder().connectTimeout(java.time.Duration.ofSeconds(2))
                .followRedirects(java.net.http.HttpClient.Redirect.NEVER).build();
        var factory = new JdkClientHttpRequestFactory(http);
        factory.setReadTimeout(java.time.Duration.ofSeconds(4));
        return RestClient.builder().baseUrl("https://api.geoapify.com").requestFactory(factory).build();
    }
    public boolean enabled() { return !key.isBlank(); }
    public Results search(String query, String user) {
        String text = query == null ? "" : query.strip();
        if (text.length() < 3 || text.length() > 120 || text.codePoints().anyMatch(Character::isISOControl))
            throw failure(HttpStatus.BAD_REQUEST, "Enter a place name between 3 and 120 characters.");
        if (!enabled()) throw failure(HttpStatus.SERVICE_UNAVAILABLE, "Online place search is temporarily unavailable. Choose on the map instead.");
        allow(user);
        try {
            // Never forward the caller's JWT, log this URI, follow redirects, or return provider errors/keys.
            return client.get().uri(builder -> builder.path("/v1/geocode/search")
                    .queryParam("text", text).queryParam("filter", "countrycode:za")
                    .queryParam("limit", 5).queryParam("format", "json").queryParam("apiKey", key).build())
                    .exchange((request, response) -> {
                        if (response.getStatusCode().value() == 429) throw failure(HttpStatus.TOO_MANY_REQUESTS, "Place search is busy. Please wait a minute and try again.");
                        if (!response.getStatusCode().is2xxSuccessful()) throw unavailable();
                        byte[] bytes = response.getBody().readNBytes(65537);
                        if (bytes.length > 65536) throw unavailable();
                        return parse(mapper.readTree(bytes));
                    });
        } catch (ResponseStatusException ex) { throw ex; }
        catch (RestClientResponseException ex) { throw unavailable(); }
        catch (Exception ex) { throw unavailable(); }
    }
    private synchronized void allow(String user) {
        long now = clock.millis(), minute = now / 60000, currentSecond = now / 1000;
        users.entrySet().removeIf(entry -> entry.getValue().minute() != minute);
        Window window = users.getOrDefault(user, new Window(minute, 0));
        if (currentSecond != second) { second = currentSecond; globalCount = 0; }
        if (window.count() >= 10 || globalCount >= 2 || (!users.containsKey(user) && users.size() >= 4096))
            throw failure(HttpStatus.TOO_MANY_REQUESTS, "Place search is busy. Please wait a minute and try again.");
        users.put(user, new Window(minute, window.count() + 1)); globalCount++;
    }
    private Results parse(JsonNode root) {
        if (root == null || !root.path("results").isArray()) throw unavailable();
        List<Place> places = new ArrayList<>();
        for (JsonNode item : root.path("results")) {
            if (places.size() == 5) break;
            if (!item.path("lat").isNumber() || !item.path("lon").isNumber() || !"za".equalsIgnoreCase(item.path("country_code").asText())) continue;
            double lat = item.path("lat").asDouble(), lon = item.path("lon").asDouble();
            if (!BusinessCoordinates.valid(lat, lon)) continue;
            String address = text(item.path("formatted"), 400);
            String name = text(item.path("name"), 160);
            if (name.isBlank()) name = text(item.path("address_line1"), 160);
            if (address.isBlank()) continue;
            if (name.isBlank()) name = address;
            places.add(new Place(name, address, lat, lon, text(item.path("datasource").path("attribution"), 300)));
        }
        return new Results(List.copyOf(places));
    }
    private static String text(JsonNode node, int limit) {
        if (!node.isTextual()) return "";
        String value = node.asText().replaceAll("[\\p{Cntrl}]", " ").strip();
        return value.substring(0, Math.min(limit, value.length()));
    }
    private static ResponseStatusException unavailable() {
        return failure(HttpStatus.SERVICE_UNAVAILABLE, "Online place search is temporarily unavailable. Try again or choose on the map.");
    }
    private static ResponseStatusException failure(HttpStatus status, String message) { return new ResponseStatusException(status, message); }
}
