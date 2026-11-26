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

## Migration and state

[V16](../backend/src/main/resources/db/migration/V16__add_test_payments.sql) adds payment attempts, minimal audit events, and cases for refunds and disputes. The parent row lock serializes initialization, verification and cancellation. Unique indexes prevent duplicate outstanding or confirmed attempts and duplicate provider transaction IDs. Attempts reference exactly one order or booking. Verified amounts are constrained to equal expected amounts, and the refund-review trigger records the case and status event for previously paid transactions that are later cancelled or rejected.

| Status | Meaning |
| --- | --- |
| PENDING | Reference persisted. Checkout initialization or confirmation can still be uncertain |
| PROCESSING | Provider checkout initialized or verification still pending |
| PAID | Test provider verified the exact amount and association |
| FAILED or ABANDONED | Provider verification returned a failed or abandoned result. A payable transaction can retry |
| REFUND_REQUIRED | A verified test payment needs review because fulfillment was closed, its payable value changed, or another attempt succeeded |

The case schema can represent refund requested, pending, confirmed or failed, and a disputed payment. This implementation opens a review case only. It neither requests refunds from Paystack nor interprets a dispute or refund webhook as authority to alter a payment. Payment confirmation leaves stock, the order status and the booking status untouched. Existing outside-platform payment arrangements remain available.

## Configuration and endpoints

- Start with `PAYMENTS_ENABLED=false` and `PAYMENTS_LIVE_ENABLED=false`. A live flag or invalid/live secret key fails startup. The backend accepts an `sk_test_` API key and an HTTPS frontend origin via `PAYSTACK_SECRET_KEY` and `PAYMENTS_WEB_ORIGIN`.
- For timestamped webhooks, set the separate test signing secret via `PAYSTACK_WEBHOOK_SECRET` and configure the exact POST endpoint in the Paystack dashboard. This implementation supports the timestamped header. Legacy-only integrations must create a test webhook signing secret first.
- The internal `mock` provider requires an enabled payment flag and an explicit local, test or e2e Spring profile. It never sends provider requests. It keeps simulation outcomes in process. Verified outcomes and history remain in PostgreSQL across restarts.
- `POST /api/payments/initialize` accepts an order/booking kind and ID. Customer ownership and the persisted price determine what is payable. ZAR amounts below Paystack's R1 test minimum are ineligible. [Supported currencies](https://paystack.com/docs/v2/api/supported-currencies)
- `GET /api/payments/history?kind=ORDER|BOOKING&id={id}` and `GET /api/payments/{reference}` expose status to the buyer or provider. Checkout links are shown only to the buyer while the transaction is payable.
- `POST /api/payments/{reference}/verify` checks the provider as the authenticated buyer. The test-profile simulation action changes the mock's response independently of verification.
- `POST /api/payments/webhooks/paystack` authenticates the original bytes and validates the event structure. A test charge event must match the provider transaction ID during independent verification. Successful commits are acknowledged and deduplicated. Unknown events are recorded without PII or raw payloads. Network and transactional failures return an error so the provider can retry.

The timestamped signature uses HMAC-SHA512 over the Unix timestamp, a period and the exact body bytes. Each delivery is validated before deduplication. Paystack signs retries with a fresh timestamp. Confirmed charge events deduplicate by test transaction ID and reference, even if payload whitespace changes. A signed success event received before the verification API reports success returns a retryable error. [Paystack webhook signing and delivery](https://paystack.com/docs/v2/za/developer-tools/integration/webhooks)

The order and booking detail pages show payment options, confirmation, pending/failure recovery and attempt history. The provider owns payment-method selection. Checkout uses same-tab HTTPS navigation to a validated Paystack host. The return route checks an authenticated reference and ignores any claimed success in query parameters. A customer who has lost their session can sign in and return to the same verified-reference screen. No Capacitor configuration or Android native app entry was found. A future native build must verify HTTPS app links, existing auth restoration and return from provider or banking apps before release.

## Settlement, fees and launch review

KasiCircle's BUSINESS and WORKER roles do not confer payment eligibility. Confirm the platform's merchant agreement and terms for collecting on behalf of sellers. A South African seller's onboarding can depend on their registration type, identity, evidence of address, bank account verification and company/director documentation. Use a provider-approved onboarding process. Seller bank details are outside this sprint. [South African compliance requirements](https://support.paystack.com/en/articles/2124418)

Paystack documents provider-managed splits via subaccounts. A future split can allocate an agreed percentage of each payment to the platform and the remainder to a seller. Confirm available split types, fee allocation, onboarding support for independent workers, settlement eligibility, and applicable verification holds with Paystack for this account. South African settlement is typically the second working day, subject to payout verification and holds. [Split payments](https://paystack.com/docs/v2/za/payments/split-payments) · [Settlement and subaccount verification](https://support.paystack.com/en/articles/2125314)

Before accepting live payments, agree whether the platform or seller bears provider fees and any applicable tax. Any future commission requires seller agreement, explicit disclosure and an approved provider-assisted split design. Confirm the merchant of record, who responds to disputes, who pays refunds and fees, and how to handle cancellations, failed payouts and tax evidence. Have the business and its advisers review the merchant contract, consumer obligations and handling of personal data. [South African pricing](https://paystack.com/za/pricing) · [South African terms](https://paystack.com/za/terms) · [Disputes](https://support.paystack.com/en/articles/2125442)

## Verification and outstanding checks

Run `mvn verify` in `backend`, then run `E2E_PAYMENTS_MOCK=true npm run test:e2e` in `frontend` with the guarded local PostgreSQL QA environment. The Playwright config checks the database name, loopback connection, actual port and isolation marker before starting Flyway or writing fixtures. It generates a temporary webhook signing secret when the mock is enabled. Set `PAYMENT_SCREENSHOT_DIR` to capture the payment screenshots. [QA database setup](QA.md)

- Backend `mvn verify` passed 313 tests with the installed Mockito agent supplied explicitly because the sandbox blocks JVM self-attachment.
- All 349 Vitest tests across 54 files passed, along with ESLint and the frontend production build.
- PostgreSQL's Flyway history recorded successful applications of V14, V15 and V16. Browser QA starts the packaged Spring application with Flyway and Hibernate schema validation enabled.
- Playwright passed 40 tests across desktop, mobile emulation and responsive projects. Four duplicate, viewport-independent API tests ran on desktop only. The payment journeys covered order failure and retry, acceptance of a revised booking quote, ignored browser success claims, concurrent initialization and verification, abandoned checkout, expired and altered webhook signatures, out-of-order delivery, replay, rollback and late payment after cancellation. The existing collection order, booking and marketplace regressions also passed.
- [Mobile payment pending](commerce-sprint-3/mobile-pending.png)
- [Desktop booking payment](commerce-sprint-3/desktop-booking-payment.png)

Real Paystack sandbox checkout, merchant eligibility and receipt of a provider-generated webhook from a public HTTPS endpoint remain pending. No Paystack test credentials or public endpoint were available to this session. Ambiguous initialization retains the same reference and requires verification or operator reconciliation rather than creating another charge. Reconciliation and refund processing must have an approved operational workflow before commercial launch. Paystack test transactions and HTTPS webhook acceptance should be rechecked after configuring the merchant's test integration.

## Sprint commits in order

1. `6c0256f` Define test checkout architecture and safeguards.
2. `d1b0690` Add payment attempts and reconciliation records.
3. `bb9b23b` Add the test-only Paystack hosted checkout gateway.
4. `008ece9` Verify and reconcile order and booking payments.
5. `d287b73` Authenticate and deduplicate Paystack test events.
6. `2b02ea1` Separate mock outcomes from verification.
7. `c144bc4` Add checkout and payment history to commerce.
8. `9c678ee` Cover the Paystack verification timeout.
9. `54b13b7` Show booking and payment references.
10. `b55b45e` Record disabled test gateway environment defaults.
11. `67b8848` Cover order and booking payment journeys in QA.
12. `docs(payments): record Sprint 3 verification and launch blockers` records the report, screenshots and roadmap update.

Run `git log --reverse --format='%h %s' 4dc4a89..HEAD` at the sprint tip for the full hash list, including the commit containing this report.
