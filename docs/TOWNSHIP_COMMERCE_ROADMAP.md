# Township commerce roadmap

The local Feature/Authentication branch is the baseline. Commerce development started after Flyway V13. Commerce will use the existing JWT authentication, business and worker ownership, notifications, and marketplace profiles. Jobs continue to use the existing application workflow.

| Sprint | Deliverable | Acceptance gate |
| --- | --- | --- |
| 1 | Provider service listings and customer bookings | Authorized participants can request, negotiate, accept, cancel and complete work. PostgreSQL preserves the records and prevents conflicting confirmed slots. |
| 2 | Business product catalog and collection orders | Customers can place and track a single-business order. Owners can fulfill it. Historical prices and inventory are transaction-safe. |
| 3 | Verified test payments | Backend verification and signed webhooks reconcile sandbox payments and refunds independently of fulfillment. Verify official Paystack South Africa guidance, account eligibility, settlement and commercial policy before enabling affected features. |
| 4 | Customer, business and worker transaction dashboards | Each role can track its own authorized commerce activity, notifications, and payment or refund outcomes. Sellers can view verified summaries. |

## Progress

Sprint 1 is implemented. V14 succeeded against the isolated QA PostgreSQL database. Desktop and mobile sessions verified service publishing, requesting work, approving a proposal and cancelling. The database-backed API checks verified authorized completion, stable booking prices, duplicate suppression and conflict handling. See the [Sprint 1 report](COMMERCE_SPRINT_1_BOOKINGS.md) for API details, screenshots, test results and limits.

Sprint 2 adds business product catalogs, single-business carts and collection orders. V15 succeeded in isolated QA PostgreSQL. The order tests cover immutable prices, inventory reservations and release, duplicate submissions and participant permissions. See the [Sprint 2 report](COMMERCE_SPRINT_2_PRODUCTS.md) for verification and screenshots.

Sprint 3 adds disabled-by-default Paystack test checkout for eligible collection orders and accepted bookings. V16 stores payment attempts, verification events and reconciliation cases separately from fulfillment. The [Sprint 3 report](COMMERCE_SPRINT_3_PAYMENTS.md) records the controlled QA results. Real Paystack test checkout, public HTTPS webhook delivery and merchant eligibility remain pending. Each sprint requires an acceptance check before starting the following sprint.
