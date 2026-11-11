# Known limitations and release conditions

- Messaging is persistent and supports manual refresh/history. No realtime websocket delivery, typing/read indicators, email or push notification delivery is implemented.
- Moderation accepts reports for businesses, workers, jobs and business reviews. Administrators record dispositions/notes; ACTIONED does not automatically hide/delete content. User-to-user messages are participant-private and are not report targets in this MVP. Any broader abuse-handling or takedown policy needs explicit product scope and appropriate privacy controls.
- Jobs allow any authenticated account to act as employer. Worker profile management requires a WORKER account. There is no separate employer account type.
- Service duplicate prechecks and database uniqueness protect sequential review/application/profile duplicates. Concurrent submissions can still produce generic database-conflict errors. Conversations canonicalize participant pairs in application code; the database does not enforce ordering of those UUIDs for external writes.
- Public business listing contact fields are intentional. Worker/job/application/conversation DTOs omit personal contact fields. JWTs in localStorage remain accessible to JavaScript; production requires a strong web-serving/content-security posture. No token revocation service, password reset, phone/social authentication, MFA, or distributed login rate limiter is implemented. Existing decorative login controls are not functioning authentication providers.
- CORS supports one configured frontend origin. Deployments serving several origins need an explicit configuration change.
- Cloudinary integration requires real deployment credentials and a live upload/delete smoke check. Browser QA deliberately avoids external storage calls.
- Local tests establish fresh-database migration success and repeat-start checksum validation, not the safety of upgrading unknown historical data. Rehearse restoration/upgrades before deployment; V4's owner uniqueness may reject pre-existing duplicates.
- Automated browser coverage is Chromium on desktop and mobile viewport emulation, not physical-device or cross-engine certification. No automated WCAG conformance, performance/load, penetration, dependency-license, or disaster-recovery certification is claimed.
- Remote CI execution, hosted infrastructure, production credentials, backups, DNS/TLS configuration and actual deployment are outside this local task's executed evidence. Nothing has been pushed or deployed.

See [feature verification](MVP_FEATURE_VERIFICATION.md) and [release readiness](RELEASE_READINESS.md) for current results and any unresolved checks.
