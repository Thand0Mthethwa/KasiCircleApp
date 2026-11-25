package com.kasicircle.backend.commerce.payments;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.net.URI;
import java.util.Map;

final class PaystackGateway implements PaymentGateway {
    private final RestClient client;
    private final ObjectMapper json;
    private final String callback;

    PaystackGateway(RestClient client, ObjectMapper json, String callback) {
        this.client = client;
        this.json = json;
        this.callback = callback;
    }

    @Override
    public String initialize(Checkout checkout) {
        try {
            JsonNode data = data(client.post().uri("/transaction/initialize").body(Map.of(
                    "reference", checkout.reference(), "amount", checkout.amount(), "currency", "ZAR",
                    "email", checkout.email(), "callback_url", callback,
                    "metadata", json.writeValueAsString(Map.of("kasicircle_association", checkout.association()))
            )).retrieve().body(JsonNode.class));
            String url = data.path("authorization_url").asText();
            if (!checkout.reference().equals(data.path("reference").asText()) || !safeCheckout(url)) {
                throw new Unavailable();
            }
            return url;
        } catch (RestClientException | com.fasterxml.jackson.core.JsonProcessingException exception) {
            throw new Unavailable();
        }
    }

    static boolean safeCheckout(String url) {
        try {
            URI uri = URI.create(url);
            return "https".equals(uri.getScheme()) && "checkout.paystack.com".equals(uri.getHost())
                    && uri.getUserInfo() == null && uri.getPort() == -1
                    && uri.getRawPath().matches("/[a-zA-Z0-9_-]+") && uri.getRawQuery() == null && uri.getFragment() == null;
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    @Override
    public Verification verify(String reference) {
        try {
            JsonNode data = data(client.get().uri("/transaction/verify/{reference}", reference)
                    .retrieve().body(JsonNode.class));
            JsonNode metadata = data.path("metadata");
            if (metadata.isTextual()) metadata = json.readTree(metadata.asText());
            var outcome = switch (data.path("status").asText()) {
                case "success" -> Outcome.SUCCESS;
                case "failed" -> Outcome.FAILED;
                case "abandoned" -> Outcome.ABANDONED;
                default -> Outcome.PROCESSING;
            };
            return new Verification(data.path("reference").asText(), integer(data.path("id")),
                    data.path("amount").isIntegralNumber() && data.path("amount").canConvertToLong() ? data.path("amount").longValue() : -1,
                    data.path("currency").asText(), data.path("domain").asText(),
                    metadata == null ? "" : metadata.path("kasicircle_association").asText(), outcome);
        } catch (RestClientException | com.fasterxml.jackson.core.JsonProcessingException exception) {
            throw new Unavailable();
        }
    }

    private Long integer(JsonNode node) {
        return node.isIntegralNumber() && node.canConvertToLong() ? node.longValue() : null;
    }

    private JsonNode data(JsonNode body) {
        if (body == null || !body.path("status").isBoolean() || !body.path("status").booleanValue()
                || !body.path("data").isObject()) throw new Unavailable();
        return body.path("data");
    }
}
