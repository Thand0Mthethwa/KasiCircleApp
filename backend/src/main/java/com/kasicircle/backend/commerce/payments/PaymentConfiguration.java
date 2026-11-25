package com.kasicircle.backend.commerce.payments;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.URI;
import java.net.http.HttpClient;
import java.time.Duration;

@Component
final class PaymentConfiguration {
    enum Provider { MOCK, PAYSTACK }

    final PaymentGateway gateway;
    final Provider provider;
    final String signingSecret;

    PaymentConfiguration(Environment environment, ObjectMapper json,
                         @Value("${payments.enabled:false}") boolean enabled,
                         @Value("${payments.live.enabled:false}") boolean live,
                         @Value("${payments.provider:paystack}") String selected,
                         @Value("${paystack.secret.key:}") String key,
                         @Value("${paystack.webhook.secret:}") String secret,
                         @Value("${payments.web.origin:}") String origin) {
        if (live || (!key.isBlank() && !key.matches("sk_test_[a-zA-Z0-9]+"))) {
            throw new IllegalStateException("This application only supports Paystack test credentials.");
        }
        signingSecret = secret.startsWith("whsec_") ? secret : "";
        if (enabled && "mock".equals(selected) && environment.acceptsProfiles(Profiles.of("test", "e2e", "local"))) {
            provider = Provider.MOCK;
            gateway = new MockPaymentGateway();
        } else if (enabled && "paystack".equals(selected) && !key.isBlank() && httpsOrigin(origin)) {
            provider = Provider.PAYSTACK;
            var factory = new JdkClientHttpRequestFactory(HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(4)).followRedirects(HttpClient.Redirect.NEVER).build());
            factory.setReadTimeout(Duration.ofSeconds(8));
            var client = RestClient.builder().baseUrl("https://api.paystack.co").requestFactory(factory)
                    .defaultHeaders(headers -> {
                        headers.setBearerAuth(key);
                        headers.setContentType(MediaType.APPLICATION_JSON);
                    }).build();
            gateway = new PaystackGateway(client, json, origin + "/payments/return");
        } else {
            provider = null;
            gateway = null;
        }
    }

    private boolean httpsOrigin(String origin) {
        try {
            URI uri = URI.create(origin);
            return "https".equals(uri.getScheme()) && uri.getHost() != null && uri.getUserInfo() == null
                    && uri.getRawPath().isEmpty() && uri.getRawQuery() == null && uri.getFragment() == null;
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }
}
