package com.kasicircle.backend.commerce.payments;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withException;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class PaymentGatewayTest {
    @Test
    void gatewayFailsClosedWithoutTestConfiguration() {
        var environment = new MockEnvironment();
        var json = new ObjectMapper();
        assertThat(new PaymentConfiguration(environment, json, true, false, "paystack", "", "", "").gateway).isNull();
        assertThat(new PaymentConfiguration(environment, json, true, false, "mock", "", "", "").gateway).isNull();
        assertThatThrownBy(() -> new PaymentConfiguration(environment, json, false, true, "mock", "", "", ""))
                .isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> new PaymentConfiguration(environment, json, false, false, "paystack", "sk_live_fixture", "", ""))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void checkoutUsesZarAndVerificationParsesTheProviderRecord() {
        var builder = RestClient.builder().baseUrl("https://api.paystack.co");
        var server = MockRestServiceServer.bindTo(builder).build();
        var gateway = new PaystackGateway(builder.build(), new ObjectMapper(), "https://example.test/payments/return");
        server.expect(once(), requestTo("https://api.paystack.co/transaction/initialize"))
                .andExpect(jsonPath("$.amount").value(4500)).andExpect(jsonPath("$.currency").value("ZAR"))
                .andRespond(withSuccess("""
                    {"status":true,"data":{"reference":"KC-abc","authorization_url":"https://checkout.paystack.com/code"}}
                    """, APPLICATION_JSON));
        server.expect(once(), requestTo("https://api.paystack.co/transaction/verify/KC-abc"))
                .andRespond(withSuccess("""
                    {"status":true,"data":{"reference":"KC-abc","id":123,"domain":"test","status":"success",
                    "amount":4500,"currency":"ZAR","metadata":{"kasicircle_association":"ORDER:example"}}}
                    """, APPLICATION_JSON));
        assertThat(gateway.initialize(new PaymentGateway.Checkout("KC-abc", 4500, "ORDER:example", "qa@example.test")))
                .isEqualTo("https://checkout.paystack.com/code");
        assertThat(gateway.verify("KC-abc")).isEqualTo(new PaymentGateway.Verification("KC-abc", 123L, 4500,
                "ZAR", "test", "ORDER:example", PaymentGateway.Outcome.SUCCESS));
        assertThat(PaystackGateway.safeCheckout("https://checkout.paystack.com@other.test/code")).isFalse();
        server.verify();
    }

    @Test
    void providerTimeoutReturnsOnlyASafeRetryableError() {
        var builder = RestClient.builder().baseUrl("https://api.paystack.co");
        var server = MockRestServiceServer.bindTo(builder).build();
        var gateway = new PaystackGateway(builder.build(), new ObjectMapper(), "https://example.test/payments/return");
        server.expect(requestTo("https://api.paystack.co/transaction/verify/KC-fixture"))
                .andRespond(withException(new java.net.SocketTimeoutException("controlled provider failure")));
        assertThatThrownBy(() -> gateway.verify("KC-fixture"))
                .isInstanceOf(PaymentGateway.Unavailable.class)
                .hasMessageNotContaining("controlled provider failure");
        server.verify();
    }
}
