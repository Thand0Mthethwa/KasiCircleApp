# Final redesign acceptance and publication audit — 2026-11-13

**Recommendation: ready for owner visual review; publication approval is conditional. Live Cloudinary acceptance is BLOCKED because rotation/revocation of previously exposed credentials has not been established. No Cloudinary request or asset mutation was performed. No push, merge, deployment, or Sprint 17 work was performed.**

## Branch and publication state

- Current branch: **`Feature/Authentication`**.
- Baseline HEAD: **`62cab3f9b1f4914692ed5b46d5d3bbcbddc8ab8d`**.
- Read-only GitHub verification returned the same SHA for `Thand0Mthethwa/KasiCircleApp` / `Feature/Authentication`. GitHub identifies the repository as **public** and its default branch as **`Feature/Authentication`**.
- There were **zero unpublished commits relative to the target upstream at audit start**. The redesign and real-backend acceptance commits were already present on GitHub before this audit. No upload by this audit is implied.
- The 73 commits after the locally stored `origin/main` ref are branch-history differences, not 73 unpublished commits. [Full commit inventory](publication-audit/COMMITS.md) records those commits and all 147 commits in the baseline branch ancestry.
- New local CI repair: **`51d74f2b201c7ae131ee7a9e35164379f31cf687`** — `fix(ci): initialize isolated PostgreSQL guard before acceptance`.
- The final documentation/audit commit and exact final HEAD are identified in the final handoff. They remain local. No history rewrite or branch switch was performed.

## Owner visual review

Inspected both migration/acceptance reports, the supplied reference README/CSS/assets, the original reference captures, and the migrated real-backend screenshots. This is a screenshot-supported review, not an exact-pixel-parity certification. No automated same-content pixel-diff threshold was computed.

| CSS viewport | Reference evidence | Real-backend evidence | Remaining visible differences |
|---|---|---|---|
| Desktop 1440×900 | [Reference](design-migration/reference-desktop-viewport.png) | [Current app](backend-acceptance/real-explore-1440.png) | Complete marketplace/account navigation replaces Explore/Saved/Sign in. Ten categories occupy two rows instead of six categories in one row, moving the directory lower. Management action, filter reset, real totals/reviews, location/province, detail links and a plum footer add content. |
| Tablet 768×1024 | [Reference](design-migration/reference-tablet-viewport.png) | [Current app](backend-acceptance/real-explore-768.png) | App uses the mobile menu and six-destination bottom navigation below 1024px; the reference retains desktop navigation until 740px. Two rows of stacked category icons replace the reference's single row. Longer placeholders/values clip within their input widths. Real filtered results and long QA names change card density/height. |
| Mobile 375×812 | [Reference](design-migration/reference-mobile-viewport.png) | [Current app](backend-acceptance/real-explore-375.png) | App adds a header login link, six bottom destinations rather than three, wider category tiles (fewer visible at once), listing-management/reset/count controls, actual metadata and detail links. Results start lower. The source's local Saved/bookmark demo is absent. |

Verified identity: deep plum/warm cream/marigold, four-square branding, Bricolage headings, DM Sans fields/body, photographic desktop/tablet hero, rounded overlapping search panel, matching mobile photo-hiding behavior and cream listing cards. All five supplied source assets match byte-for-byte. Fontsource OFL licences are bundled.

The historical [geometry record](design-migration/comparison.json) matches hero/search rectangles at the three requested viewports and records matching body ink/heading font family. The real browser acceptance verifies rendered brand squares, decoded visible images and no document overflow. Real screenshots deliberately contain persisted UUID test records, whereas the reference contains short fictional sample listings; their text and result counts are not comparable pixel-for-pixel. Mobile captures use device pixel ratio 3, and full-page captures show fixed navigation at the viewport edge inside the larger document image.

An older desktop migration viewport capture omits the brand squares. The newer real-backend captures show all four squares and are the preferred owner-review evidence. No application styling was changed in this audit.

**Owner decisions pending:** approve the documented functional visual differences; confirm supplied-photo redistribution rights and the existing project licence choice. The reference README calls the photos illustrative but supplies no explicit image redistribution licence, creator attribution or release evidence. Existing Apache/OFL/NOTICE files were preserved. No legal rights clearance is claimed.

## Cloudinary acceptance

The prior [startup diagnosis](LOCAL_BACKEND_STARTUP_DIAGNOSIS.md) explicitly records exposure of local Cloudinary credentials and requires provider rotation. Subsequent acceptance documents do not establish completion. Current local credential fields exist in ignored, owner-only `backend/.env.local`; their presence does not prove that the exposed key was revoked or that the replacement is safe. No secrets or credential fingerprints were printed. A comparison against tracked launch history found no match to the current secret, which does not establish provider rotation.

**Live-service portion stopped before credential validation or network access**, as requested. No temporary cloud images were created; no existing image or real business listing was modified; cloud cleanup was therefore unnecessary.

| Requested behavior | Evidence available | Live provider result |
|---|---|---|
| JPEG/PNG/WebP upload | Validator, controller, service and mocked storage tests; signatures and JPEG/PNG decode validation inspected | Not run — rotation unverified |
| Type/size validation | Empty/unsupported/corrupt/oversized checks; 5 MiB validator limit and multipart bounds inspected | No provider call required; automated tests passed |
| Retrieval | Public image API/controller tests and real PostgreSQL gallery tests with controlled image metadata | External Cloudinary URL lifecycle not tested |
| Cover selection | Service/controller tests; owner check, unset prior cover, first-image cover behavior inspected | Not run |
| Deletion | Mocked provider destroy, owner/business-scoped image lookup and cover promotion tests | Not run |
| Ownership/authorization | BUSINESS-account/owner gates inspected for upload, cover and delete; existing negative authorization tests passed | No live asset mutation attempted |
| Cleanup | Compensating cleanup-on-save-failure and deletion handling covered by mocked tests | No cloud assets created or deleted |

Fresh execution: **41 image-related backend tests passed**, zero failures/errors/skips: 9 validator, 7 mocked storage, 13 service and 12 controller tests. This does not certify live Cloudinary credentials or cleanup of actual provider assets.

After rotation/revocation is confirmed privately, the remaining live check must use the isolated QA database, newly created test-owned businesses and a run-specific ledger of uploaded IDs. Only those returned IDs may be selected/deleted. Verify supported uploads, invalid input rejection, real URL retrieval, cover changes, anonymous/non-owner denial and removal of every ledger asset in cleanup. Do not load credentials into the committed CI workflow or report them in logs/chat.

## Pre-push audit and CI repair

- Initial worktree was clean. Unrelated application, API, auth, route, dependency and database-migration files remain unchanged by this audit.
- Bounded all-history scan: **154 reachable commits / 893 blobs**, comparing selected known private local values and high-confidence private-key/GitHub-token/AWS-key/credentialed-Cloudinary-URL patterns. **No matches found.** [Sanitized scan result](publication-audit/secret-scan.json). This is not a guarantee that every possible secret format was detected.
- No tracked `target`, `dist`, `node_modules`, browser trace/report/output directories, JAR/class/bytecode artifacts were found. Deliberate screenshots under `docs/` and original reference assets are review/source assets, not build outputs.
- Private backend/frontend/QA environment files remain ignored; only reviewed environment examples are tracked. No provider credential or generated database password was added.
- All five reference assets are present and identical. Production JS contains no QA listing fixture labels. No application migration changed in the reference-design/acceptance range or in this audit.
- Existing branch history after `origin/main` includes intentional earlier MVP migrations; none were rewritten or reclassified as redesign-only changes.
- No frontend router, API service or auth context changes were made. The fresh full frontend suite and real browser journeys protect the covered routes.

**CI defect found:** the current Playwright configuration requires the live `e2e_guard.identity` marker, but the existing GitHub PostgreSQL service setup never created it. A fresh hosted run would stop at preflight.

**Focused repair:** `.github/workflows/ci.yml` now initializes that marker in the disposable loopback `kasicircle_qa` CI service before app migrations/startup. `frontend/scripts/bootstrap-e2e-marker.sql` checks `current_database()` before any schema write, runs atomically and idempotently, and exits on error. The existing CI-only password is a disposable fixture; no new repository secret is required. No passing application functionality changed.

Local PostgreSQL 18 validation passed setup twice, marker idempotence, and rejection of the private cluster's maintenance database before any schema write. The negative check verified that no guard schema appeared there. No development database was accessed. [Guard evidence](publication-audit/ci-guard-validation.json). Workflow YAML parsed and target/order checks passed. `actionlint` was unavailable, and no fresh hosted PostgreSQL 16/Actions run is claimed or dispatched. Hosted verification follows a separately authorized push.

## Fresh verification

- Image-related backend tests: **41 passed**, command completed successfully. The previous full **242-test** backend acceptance remains historical supporting evidence; unchanged backend application code did not require another complete backend run here.
- Real Spring Boot/PostgreSQL desktop/mobile browser suite: **14 passed**, clean exit (4.1m), with all 16 worker-filter combinations in each browser project. Uses only `kasicircle_qa` on 55432, with Cloudinary credentials explicitly blank.
- Frontend complete rerun: **237 tests / 38 files passed**, clean exit, `npm test -- --maxWorkers=1 --pool=threads` (211.83s). The first fork-pool run reported 237/237 tests passed but its shell exited 143 before follow-on checks; that process result is not called a clean pass. The clean rerun preserved all assertions.
- ESLint plus explicit `.mjs` helper lint: **passed**. Production build: **passed** (6.38s), unchanged application CSS/JS bundles.
- `git diff --check`, source asset identities, tracked-artifact review, secret scan and CI SQL/YAML checks: **passed within the scopes above**.
- The audit-started QA cluster was stopped after browser checks, retaining test records. Application migrations and existing development data were not changed by the audit.

## Publication recommendation and safe command

**Ready for owner review; further publication remains conditional on owner visual/asset-rights approval. Live Cloudinary sign-off remains blocked on confirmed rotation/revocation and the temporary-asset lifecycle test.** The repository and audited baseline are already public; this audit does not undo or authorize that earlier publication. The next push would publish only the new local audit/CI-repair commits to the existing default feature branch. New hosted CI results are still pending; local checks do not replace them.

After owner approval, review the final HEAD and clean status. The non-forcing command for the verified target branch is:

```sh
git push origin HEAD:refs/heads/Feature/Authentication
```

This command was **not executed**. It does not merge or deploy; a conflicting remote advance will be rejected rather than overwritten. The source workflow can run automatically after a future authorized push. Do not use a force push or silently change the target to another branch.

## Audit changes

Only the two CI-bootstrap files and this publication review/evidence package were added/changed. Existing visual captures, application behavior, storage implementation, API contracts, applied migrations and unrelated work were preserved. The final handoff supplies the exact final branch/HEAD and new commit hashes; the inventory records the full baseline history and CI-repair commit.
