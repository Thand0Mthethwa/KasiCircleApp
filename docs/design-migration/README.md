# Explore reference comparison

The reference runs on `http://127.0.0.1:5175/#/explore`; the functional app runs on `http://127.0.0.1:5174/explore`.

The capture script uses explicit QA-prefixed business records **only in browser request interception** to compare card geometry. These are not live businesses and are never imported into application code or written to a database. Listing photo URLs in the functional app continue to come from the API. The reference uses its own original sample records.

| Viewport | Reference | Migrated app |
|---|---|---|
| 1440 × 900 | [Reference desktop](reference-desktop-viewport.png) | [App desktop](actual-desktop-viewport.png) |
| 768 × 1024 | [Reference tablet](reference-tablet-viewport.png) | [App tablet](actual-tablet-viewport.png) |
| 375 × 812 | [Reference mobile](reference-mobile-viewport.png) | [App mobile](actual-mobile-viewport.png) |

Full-page versions are alongside the viewport captures. [Measured geometry](comparison.json) includes hero and search rectangles, font family, body ink and document width.

Intentional functional differences: real route navigation and account controls, all ten backend category filters, real review counts, listing-management action, server totals/pagination, honest missing-image/error/empty states, and no demo Saved feature. Default city is unfiltered so real API records remain discoverable. Labels are shortened for layout while accessible labels and submitted category values retain the full backend names.

Reproduce with the two local servers running:

```sh
node docs/design-migration/compare.mjs
cd frontend
npx playwright test --config playwright.visual.config.js
```

The separate visual Playwright config runs the existing UI fixture journeys without requiring a database. The original `playwright.config.js` remains responsible for isolated PostgreSQL desktop/mobile integration journeys. UI fixture success does not establish live backend success.

Asset licensing uncertainty is recorded in [the migration report](../FRONTEND_DESIGN_MIGRATION.md). No publication, push or deployment is performed.

## Other migrated routes

These images use the existing browser QA fixtures, not production records.

| Page | Desktop | Mobile |
|---|---|---|
| home | [1440px](routes/home-1440.png) | [375px](routes/home-375.png) |
| workers | [1440px](routes/workers-1440.png) | [375px](routes/workers-375.png) |
| jobs | [1440px](routes/jobs-1440.png) | [375px](routes/jobs-375.png) |
| login | [1440px](routes/login-1440.png) | [375px](routes/login-375.png) |
| messages | [1440px](routes/messages-1440.png) | [375px](routes/messages-375.png) |
| business-profile | [1440px](routes/business-profile-1440.png) | [375px](routes/business-profile-375.png) |
| admin_reports | [1440px](routes/admin_reports-1440.png) | [375px](routes/admin_reports-375.png) |
