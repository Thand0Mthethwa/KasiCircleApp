# Real backend browser acceptance

**14/14 real desktop/mobile cases passed**, against Spring Boot on 18081 and PostgreSQL 18.6 database `kasicircle_qa` in a separate cluster on 55432. These cases have no API request interception. UUID-prefixed records were persisted only in that isolated database.

Image metadata was seeded only in the verified test database and retrieved through the actual image API; the photo is a controlled local fixture. This verifies image display/gallery, not external Cloudinary upload/delete.

| CSS viewport | Real Explore capture |
|---|---|
| 1440 × 900 | [Desktop](real-explore-1440.png) |
| 768 × 1024 | [Tablet](real-explore-768.png) |
| 375 × 812 | [Mobile](real-explore-375.png) |

Images are full-page captures; mobile uses device pixel ratio 3. The fixed mobile navigation appears at the viewport edge inside a full-page image. Automated checks verify document width, four rendered brand squares and decoded visible images at each size. Long names are intentionally unique QA records, not fabricated live business listings.

| Workflow | Desktop | Mobile |
|---|---|---|
| Actual owner-created/edited business, real filtering | [Explore](real-explore-desktop.png) | [Explore](real-explore-mobile.png) |
| Actual image API and detail/gallery | [Detail](real-business-detail-desktop.png) | [Detail](real-business-detail-mobile.png) |

[Executed verification summary](verification.txt) · [Full acceptance report](../REAL_BACKEND_INTEGRATION_ACCEPTANCE.md) · [Original reference comparison](../design-migration/README.md)

The test cluster is stopped after acceptance and retains its records. Restart/setup instructions are in the report; credentials remain in the ignored local environment file.
