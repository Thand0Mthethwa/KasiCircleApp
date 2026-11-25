# Commerce Sprint 3 — Test payments

## Architecture decision

Use server-initialized, provider-hosted Paystack checkout in test mode. The customer identifies an order or booking. The server reads the immutable order total or accepted booking price, converts it to exact ZAR cents and records a unique attempt before contacting the provider. Fulfillment and payment have separate state and audit records. Paystack verification must match the test environment, reference, amount, ZAR and the persisted transaction identifier in metadata. Browser returns and signed webhook events only request verification.

Payment can begin for a placed or accepted order and an accepted booking with a positive agreed price. Keep one outstanding attempt per item and resume it when possible. Ambiguous initialization and verification failures stay pending for reconciliation. A verified decline or abandonment allows a retry. Cancellation never releases stock through payment processing. The existing order cancellation path controls stock. There is no automatic stock expiry in Sprint 2, so stock stays reserved until the existing release or fulfillment path applies. Verified payment for a closed sale or a second successful attempt requires refund review. A refund review is neither a refund request sent to Paystack nor proof of a refund.

Use timestamped Paystack-Signature verification over the original request bytes, with constant-time comparison, a five-minute freshness window and durable event deduplication. Return success only after the event is committed. Maintain provider identity and data integrity checks regardless of event source. Use a deterministic internal mock for controlled tests.

## Provider references

- [Paystack South Africa checkout](https://paystack.com/docs/v2/za/payments/online/quickstart)
- [Transaction API](https://paystack.com/docs/api/transaction/)
- [Test payments](https://paystack.com/docs/v2/za/developer-tools/integration/test-payments)
- [Webhook signatures and retries](https://paystack.com/docs/v2/za/developer-tools/integration/webhooks)
- [Split payments](https://paystack.com/docs/v2/za/payments/split-payments)
- [Refunds](https://paystack.com/docs/payments/refunds/)

Live keys, live transactions, payouts and commissions are outside this implementation. Merchant and seller eligibility must be confirmed before any live offering.
