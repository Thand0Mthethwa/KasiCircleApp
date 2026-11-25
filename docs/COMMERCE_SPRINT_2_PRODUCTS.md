# Commerce Sprint 2 — Products and collection orders

## Implementation

Businesses manage their own catalogs, with prices in ZAR, availability, optional tracked stock, visibility and an optional reference to an existing image from their gallery. Public product cards appear on the existing business detail page. Guests can build a cart and return to it after signing in or registering.

Each cart belongs to one business. Adding a product from another business prompts for confirmation before replacing the existing cart. Checkout reviews current prices, quantities, the business’s listed address, a zero collection fee and the total. Changes in price or availability require a new review. Customers confirm the order details before submission. KasiCircle records the collection order only. The participants arrange payment directly.

Order items preserve the product name, quantity and unit price at placement. The order preserves the business name, collection address, total, customer display name, notes and a unique reference. PostgreSQL stores history events for each status change. Notifications link to the corresponding private order.

## Migration and inventory

[V15](../backend/src/main/resources/db/migration/V15__create_products_and_orders.sql) creates `products`, `customer_orders`, `customer_order_items` and `customer_order_status_history`, and adds `ORDER_UPDATE` to the existing notification type constraint. Catalog amounts use integer ZAR cents. The migration seeds no products and adds no payment or Cloudinary operations.

Order placement deducts tracked quantities from available stock in the same transaction that creates the order, item snapshots, initial event and seller notification. Rejecting or cancelling returns tracked quantities once. Starting preparation closes the cancellation window and commits the deduction. Completing the order records collection and leaves inventory as deducted. Manual availability uses no quantity deduction. A product cannot switch from tracked to manual stock while its reservations may still be released.

Catalog writes, checkout and stock returns use a transaction lock on the business row. A product revision prevents a stale catalog edit from overwriting inventory changed by checkout or cancellation. A unique authenticated request key and payload fingerprint allow the same submission to be retried safely. Reusing a key with different order details returns a conflict. Product visibility and price changes do not affect saved orders.

## Roles and lifecycle

| Current status | Customer | Owning business |
| --- | --- | --- |
| Placed | Cancel | Accept or reject |
| Accepted | View | Start preparing or cancel |
| Preparing | View | Mark ready for collection |
| Ready for collection | View | Mark collected |
| Completed, rejected, cancelled | View | View |

Customers access their own orders. Business accounts manage orders for their own listings. Administrators can read a known order for oversight. Only participants can change its status. Business owners cannot purchase from their own businesses. The buyer waits for the business to mark the order ready before collection.

## API

| Method and resource | Behavior |
| --- | --- |
| `GET /api/businesses/{id}/products` | Paginated public catalog with availability and optional image |
| `GET /api/products/mine` | Current business owner’s catalog, including hidden products and inventory |
| `POST /api/products`, `PUT /api/products/{id}` | Owner creates or edits a product. An edit includes the current revision. Set `active` to false to hide a product |
| `POST /api/orders/review` | Signed-in checkout review. Returns current prices and availability |
| `POST /api/orders` | Places a collection order using the reviewed cart and a UUID request key. Returns 409 when prices or availability have changed |
| `GET /api/orders/my`, `GET /api/orders/incoming` | Paginated buyer and business histories |
| `GET /api/orders/{id}` | Private order detail, status history and actions |
| `PATCH /api/orders/{id}/status` | Applies a permitted transition from the expected current status |

## Frontend

- Existing `/businesses/:id` includes product cards alongside services, reviews and contact information.
- `/products/manage` supports catalog management.
- `/cart` handles quantities, removal, clearing, price review and collection checkout.
- `/orders`, `/orders/incoming` and `/orders/:id` show orders, controls and status history.
- Profile navigation and notifications link to order pages.

## Screenshots

- [Mobile collection checkout](commerce-sprint-2/mobile-cart-review.png)
- [Desktop order ready for collection](commerce-sprint-2/desktop-ready-order.png)

## Verification

Verification runs on the identity-checked loopback `kasicircle_qa` database for real PostgreSQL tests. Existing backend tests use their configured in-memory environment. The browser tests use generated QA accounts and a controlled gallery image fixture. Flyway records V15 as successful.

| Check | Result |
| --- | --- |
| Maven backend tests | 307 passed with Mockito attached as a Java agent |
| Vitest frontend tests | 345 passed in the full suite, followed by one additional focused checkout recovery test |
| ESLint and Vite build | Both passed |
| Desktop, mobile and responsive Playwright | 34 passed. The two API-only concurrency checks ran on desktop and were intentionally skipped in the mobile project. |

The first desktop checkout run exposed a login redirect issue. The corrected desktop and mobile journeys verified cart retention, price review, successful order placement after a lost response and collection status updates.

To reproduce, verify the designated QA database with `npm run test:e2e:status` from `frontend`, package the backend, then run `npm run test:e2e`. To regenerate the screenshots, set `PRODUCT_SCREENSHOT_DIR=../docs/commerce-sprint-2` for the products spec.

## Files and commits

Changes are in the backend product commerce package, V15 and the notification type. The frontend adds catalog/cart components, checkout and order pages, and extends business detail, login, registration, profile and notification navigation. Tests cover cart replacement, monetary bounds, role permissions, stock concurrency, retries, price review and order history.

Implementation commit `93bfbc6f5d02a9a6b2fc63d5eb4c5a36ebd5859f`.

## Known limitations and production requirements

- Cart details live in the current browser tab. If a submission response is lost, retry from the open checkout or check My orders before placing another order.
- Collection uses the business’s existing listing address. Businesses coordinate collection hours directly.
- Sprint 3 owns payment initiation, verification and refunds. Orders in this sprint have an outside-platform payment label.
- Validate V15 in the normal staging migration process before a production rollout.
