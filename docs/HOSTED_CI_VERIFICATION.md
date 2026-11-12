# Sprint 15 — hosted CI verification

This document records Sprint 15 local CI preparation and the remaining hosted acceptance gate. **Hosted CI remains BLOCKED / unverified until an actual GitHub Actions run succeeds for the prepared commit.** No workflow run, push, merge or deployment is performed by this preparation task.

## Repository and commit checkpoint

- Repository: `Thand0Mthethwa/KasiCircleApp`.
- Local branch and verified GitHub default branch: `Feature/Authentication` (checked 2026-11-12).
- The remote branch is not protected and GitHub currently lists **zero registered workflows**. The new CI definition must be published before its Actions page/manual trigger exists.
- Starting HEAD: `f901b800b05264d15ccd2c9ebe3b8b9e2c938ee3`.
- Verified remote branch tip at inspection: `8be31ae04bdce451293d1d7a9c749e208f0c3f30`.
- Starting branch was **18 commits ahead** of that tip, including the following four latest commits. The Sprint 15 preparation commit adds one more. Publishing the branch publishes all unpublished ancestors, not only these four.

| Commit | Change |
|---|---|
| `f901b80` | Document reconciled MVP evidence and release acceptance gates |
| `5b323af` | Add integrated marketplace browser QA and patch frontend dependencies |
| `47f27d8` | Preserve job form input and allow retry after save failure |
| `c1cb64d` | Reconcile MVP evidence and paginate worker discovery |

Unrelated local changes in `backend/MIGRATIONS.md`, `frontend/src/services/api.js`, `frontend/src/services/api.test.js`, and the untracked backend workspace file are preserved and excluded. Local validation uses an isolated clean archive of `f901b80` application source, with only this Sprint's workflow and Home test assertion fixes overlaid, not those unrelated edits.

## Workflow contract

`.github/workflows/ci.yml` runs on pushes, pull requests and manual `workflow_dispatch` events. Both jobs use Ubuntu 24.04; the backend job has a 25-minute limit and frontend has 15 minutes. The workflow performs verification only.

| Job / step | Configuration |
|---|---|
| backend: Java build/test/package | Temurin Java 21, Maven cache, `mvn --batch-mode verify` |
| backend: PostgreSQL integration | Ephemeral `postgres:16`, database `kasicircle_qa`, health check, local port 5432; Flyway and Hibernate validation exercised by packaged startup and browser journeys |
| backend: database client | Explicit `postgresql-client` install on the runner; browser admin fixtures call `psql` outside the service container |
| backend: startup check | Start executable JAR, wait for public `/api/businesses`, fail on exit/timeout, stop process at step exit |
| backend: browser install | Node 22, `npm ci`, `npx playwright install --with-deps chromium` |
| backend: browser tests | `npm run test:e2e`: four journeys each at desktop/mobile size, one worker, real backend/JWT/PostgreSQL |
| frontend: reproducible install | Node 22, committed lockfile, `npm ci` |
| frontend: component/API/route tests | `npm test -- --maxWorkers=1 --no-file-parallelism` |
| frontend: lint/build | `npm run lint` and `npm run build` |

Maven tests use H2/mocks; PostgreSQL-specific migrations and integrated behavior are verified by the packaged-app and browser steps. Browser tests deliberately exclude live Cloudinary storage and do not deploy. Local PostgreSQL 18 checks do not constitute a hosted PostgreSQL 16 result.

## Permissions, secrets and dependencies

Read-only GitHub API checks on 2026-11-12 confirmed Actions enabled, `allowed_actions=all`, `sha_pinning_required=false`, default workflow token permission `read`, and PR-review approval permission disabled. No repository settings were changed. The workflow explicitly requests only `contents: read`; no workflow write token, cloud credentials or deployment environment is needed.

**No additional GitHub repository secrets or variables are required by this CI definition.** Database/JWT values in the workflow and browser harness are disposable test fixtures. Production database, JWT, Cloudinary, PAT or deployment credentials must not be added to it. GitHub supplies its own automatic job token; do not create a secret named GITHUB_TOKEN.

Hosted runners need outbound access to checkout/actions, Maven repositories, npm, Ubuntu package mirrors, the public PostgreSQL container registry and Playwright browser downloads. Ubuntu runners provide Docker and sudo; the workflow installs the PostgreSQL client and browser OS dependencies explicitly. If repository policy changes, permit `actions/checkout@v4`, `actions/setup-java@v4`, `actions/setup-node@v4` and their normal cache operations. Fork pull requests may require an authorized maintainer's Actions approval under repository policy; do not change to `pull_request_target` to bypass it.

The publishing operator needs Git access allowed to update workflow files and write access to manually trigger Actions. Read-only workflow tokens inside jobs do not authorize publishing. Authenticate Git/`gh` as appropriate; never print or paste a token into logs or documentation.

## Local checks for this preparation

The initial clean frontend run exposed a navigation race (196 passed / 1 failed). The two remaining Home URL assertions now wait for asynchronous routing, matching the already-waited search assertion. No application behavior was changed. The full final rerun passed. Results below are executed local evidence, not hosted success.

| Check | Result |
|---|---|
| Workflow lint | actionlint 1.7.11 passed; official release binary checksum verified. |
| Reproducible frontend install | Clean `npm ci` passed; 356 packages installed; audit reported zero vulnerabilities. |
| Java 21 Maven verification | 241 tests passed, zero failures/errors/skips; JAR packaged successfully from clean committed source. |
| Sequential frontend suite | Final rerun: 197 passed across 32 files with one worker and file parallelism disabled; all three Home navigation tests passed. The earlier 195 worktree total excluded two tests removed in preserved, uncommitted API-test edits. |
| ESLint and production frontend build | Passed against clean committed source. |
| Playwright-managed Chromium installation/journeys | Managed Chromium/headless shell installed successfully; all 8 desktop/mobile journeys passed (3.5 minutes). No system Chrome override. |
| Packaged startup and Flyway | Workflow startup script passed against fresh isolated PostgreSQL 18; all 11 Flyway migrations successful and Hibernate validation/startup passed. Only the diagnostic log path differed from the hosted script. |
| GitHub Actions permission settings | Read-only verification passed as described above. |
| Hosted GitHub Actions | **NOT RUN / BLOCKED**; prepared commit is unpublished. |

Local preparation is **COMPLETE**. Actionlint, YAML assertions, startup-shell syntax, documentation links, whitespace and preservation of all four unrelated files were checked. No PostgreSQL 16 container/Ubuntu 24.04 runner was available locally; the hosted OS/service combination and its package-install steps remain for the actual Actions run.

## Exact operator steps after local preparation

The following commands are instructions for a separately authorized operator. They were **not executed** by this task.

1. Review the full unpublished history and record the intended release SHA from this checkout:

   ```bash
   git status --short
   git log --oneline origin/Feature/Authentication..HEAD
   git rev-parse HEAD
   ```

   The unrelated unstaged edits are not part of that SHA. Do not stage them just to trigger CI. The upstream comparison uses the cached tracking ref; inspect the live tip with `git ls-remote origin refs/heads/Feature/Authentication` before publishing. If it has advanced, reconcile that history deliberately; do not force-push.

2. **Only after authorizing publication of the full commit chain**, publish this branch:

   ```bash
   git push origin HEAD:refs/heads/Feature/Authentication
   ```

   This triggers the `push` workflow without a PR or merge. A rejected non-fast-forward push needs history reconciliation, not a force push. No deployment is attached to the workflow.

3. Find the run for the exact published commit, rather than accepting an older green run:

   ```bash
   ci_release_sha=$(git rev-parse HEAD)
   gh run list --repo Thand0Mthethwa/KasiCircleApp \
     --workflow ci.yml --branch Feature/Authentication --commit "$ci_release_sha" \
     --limit 10 --json databaseId,headSha,event,status,conclusion,url
   ```

   It can take a short time to appear. An empty list is not success. Select the run ID whose `headSha` equals `ci_release_sha` and event is `push` (or the deliberate manual run below).

4. To deliberately run again after the workflow has been published, use **Actions → CI → Run workflow → Feature/Authentication**, or:

   ```bash
   gh workflow run ci.yml --repo Thand0Mthethwa/KasiCircleApp --ref Feature/Authentication
   ```

   Then repeat the exact-SHA run listing above. Manual dispatch requires this workflow definition on GitHub's default branch. At inspection that default is already `Feature/Authentication`; publishing this branch makes the trigger available without merging. If the default changes, automatic push runs still work; do not assume manual dispatch is registered until its default-branch requirement is met. See [GitHub's manual workflow instructions](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow).

5. Inspect and wait for the selected run. Replace `123456789` with its actual database ID:

   ```bash
   ci_run_id=123456789
   gh run watch "$ci_run_id" --repo Thand0Mthethwa/KasiCircleApp --exit-status
   gh run view "$ci_run_id" --repo Thand0Mthethwa/KasiCircleApp \
     --json headSha,status,conclusion,jobs,url
   # If a step fails:
   gh run view "$ci_run_id" --repo Thand0Mthethwa/KasiCircleApp --log-failed
   ```

   The installed CLI's help notes limitations for `run watch/view` with fine-grained PATs; use the GitHub Actions web UI if that applies. Require `status=completed`, `conclusion=success`, the intended `headSha`, and **both backend and frontend jobs successful**. Inspect that test, migration/startup, browser, lint and build steps actually ran successfully. Pending, skipped, cancelled or previous-commit checks are insufficient.

6. Record the run URL, ID, attempt, full commit SHA, completion time and both job/step results in `MVP_FEATURE_VERIFICATION.md`, `RELEASE_READINESS.md` and `SPRINT_PROGRESS.md`. Only then change the hosted-CI requirement from BLOCKED to COMPLETE. If CI fails, fix that failure in a focused local commit and verify a run on the new commit; reruns must be identified by attempt.

Production acceptance (historical-data migration/backup rehearsal, actual environment/TLS, live Cloudinary smoke checks and documented limitations) remains separate. A green CI run does not authorize deployment or merging.

Repository settings guidance: [GitHub Actions permissions](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository). No settings changes are requested by this prepared workflow.
