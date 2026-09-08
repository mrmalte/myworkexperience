# Tasks: Base Path Deploy (Subdirectory Hosting)

**Input**: Design documents from `/specs/006-base-path-deploy/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/root-htaccess.md, quickstart.md

**Tests**: Not requested — no automated test tasks included. Verification is manual per quickstart.md (grep/curl/click-through), consistent with this project's existing convention (no test suite; specs define manual acceptance scenarios).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Define the single source of truth for the base path value before anything reads it

- [X] T001 Create `.env.production` at the repo root (new file, committed — contains no secret) with `NEXT_PUBLIC_BASE_PATH=/cv`, per [data-model.md](data-model.md) and [research R2](research.md#r2-where-the-base-path-value-lives-single-source-of-truth-fr-004)

---

## Phase 2: User Story 1 — Browse the site at its new location (Priority: P1) 🎯 MVP

**Goal**: `https://malte.sarner.se/cv/` serves the full site — styled pages, working nav, working language switch, working PDF/Word downloads — with every framework-emitted and raw-anchor URL correctly prefixed.

**Independent Test**: Build the export, serve `out/` mounted at a local `/cv` prefix, and click through all eight acceptance scenarios in [spec.md US1](spec.md#user-story-1---browse-the-site-at-its-new-location-priority-p1).

### Implementation for User Story 1

- [X] T002 [P] [US1] Add `basePath: process.env.NEXT_PUBLIC_BASE_PATH || ""` to `next.config.mjs` (depends on T001)
- [X] T003 [P] [US1] Prefix the four raw `<a href download>` links in `components/Menu.tsx` (desktop PDF, desktop Word, mobile PDF, mobile Word) with `process.env.NEXT_PUBLIC_BASE_PATH`, per [FR-003](spec.md) / [research R4](research.md#r4-raw-anchors-require-explicit-prefixing-fr-003) — do **not** touch the active-page comparison (`pathname.includes(...)`) or the language-switch regex, which need no change per [research R3](research.md#r3-behavior-of-usepathname-nextlink-and-redirect-under-basepath) (depends on T001)
- [X] T004 [US1] Run `npm run export` and verify per [quickstart.md step 1](quickstart.md#1-build-and-verify-the-base-path-locally): `grep -r '"/_next/' out/` and the `"/cv-{lang}-` anchor grep both show zero unprefixed occurrences, `grep -r '"/cv/cv/' out/` shows zero doubled-prefix occurrences, and `grep -n '"/cv"' next.config.mjs components/Menu.tsx` shows no stray hardcoded literal outside the `process.env.NEXT_PUBLIC_BASE_PATH` reference — confirms [SC-004](spec.md) and [FR-004](spec.md) (depends on T002, T003)
- [X] T005 [P] [US1] Run `npm run dev` and confirm `http://localhost:3000/` still redirects to `/en/` (not `/cv/en/`) — confirms `.env.production` does not leak into `next dev`, per [quickstart.md step 2](quickstart.md#2-confirm-dev-is-unaffected) (depends on T002)
- [X] T006 [US1] Serve `out/` mounted at a local `/cv` prefix and manually verify all eight acceptance scenarios from [spec.md US1](spec.md#user-story-1---browse-the-site-at-its-new-location-priority-p1): home redirect to `/cv/en/`, Technologies nav with active-link highlight, language switch to `/cv/sv/`, PDF download in both languages, Word download in both languages, not-found page with home link under `/cv/`, the bare `/cv/contact` and `/cv/technologies` redirect stubs, and Swedish Technologies/Contact navigation with active-link highlight — per [quickstart.md step 3](quickstart.md#3-serve-the-export-locally-under-cv-and-click-through) (depends on T004)

**Checkpoint**: The site works correctly end-to-end at `/cv/` when served locally. This is the MVP — everything else builds on this working.

---

## Phase 3: User Story 2 — Reach the site from the bare domain (Priority: P1)

**Goal**: `https://malte.sarner.se/` issues a single, non-looping `301` to `/cv/`.

**Independent Test**: `curl -sI` the bare domain and `/cv/` per [contracts/root-htaccess.md verification](contracts/root-htaccess.md#verification).

### Implementation for User Story 2

- [X] T007 [P] [US2] Create `deploy/root.htaccess` with the exact content specified in [contracts/root-htaccess.md](contracts/root-htaccess.md) (`RedirectMatch 301 ^/$ /cv/` with its explanatory comment) — independent of User Story 1's code changes, no dependency on T001–T006
- [X] T008 [US2] Manually upload `deploy/root.htaccess` to the domain's document root as `.htaccess` (**not** inside `/cv/`) and verify with the `curl -sI` commands in [contracts/root-htaccess.md](contracts/root-htaccess.md#verification) — confirms [SC-002](spec.md). Requires the site to already be live under `/cv` to observe a `200` on the second check, so run this after User Story 3's deploy (T010) (depends on T007, T010). Done 2026-08-18 by the maintainer.

**Checkpoint**: The bare domain redirects visitors to the working site in exactly one hop.

---

## Phase 4: User Story 3 — Deploy to the subdirectory (Priority: P2)

**Goal**: `npm run deploy:full` uploads into `/cv` on the server and keeps stale PDF/DOCX cleanup scoped to `/cv`, without touching the domain root.

**Independent Test**: Run the deploy with `FTP_REMOTE_DIR` set to the filesystem path that resolves to Apache's `/cv` (verify with the `curl --ftp-ssl -Q "PWD"` diagnostic in [research R7](research.md#r7-ftp_remote_dir-is-a-filesystem-path-not-the-sites-url-path) before trusting it) and confirm files and cleanup both land where the live site is actually served from, per [spec.md US3](spec.md#user-story-3---deploy-to-the-subdirectory-priority-p2).

### Implementation for User Story 3

- [X] T009 [P] [US3] Set `FTP_REMOTE_DIR=/cv` in `.env.local` (local file, not committed) — per [FR-011](spec.md). No code change required in `tools/deploy-ftp.ts`: `uploadSite()`, `cleanupOldPdfs()`, and `cleanupOldDocx()` already parameterize on `cfg.remoteDir`, per [research R6](research.md#r6-deploy-tool-changes-required). No dependency — this is a standalone env var edit; T010 (the actual deploy) is what needs both this and a correct build from User Story 1. **⚠ Corrected 2026-08-18 — see T016**: `/cv` was the wrong value for this host.
- [X] T010 [US3] Run `npm run deploy:full` and verify the build output appears under `/cv` on the server with directory structure preserved — confirms [FR-011](spec.md) / [SC-005](spec.md) (depends on T009, T004, **T016**). Confirmed 2026-08-18 via `lftp` listing of `/malte.sarner.se/public_html/cv`: correct directory structure (`en/`, `sv/`, `contact/`, `technologies/`, `_next/`, `content/`, `404/`), `.htaccess`/`index.html`/`index.txt` present, all with today's timestamps.
- [X] T011 [P] [US3] Verify stale-file cleanup is scoped correctly: with a previous deploy's `cv-*.pdf`/`cv-*.docx` present in `/cv` on the server, confirm the next deploy removes only the stale ones from `/cv` and leaves the domain root untouched — confirms [FR-012](spec.md) and [FR-013 in 003](../003-ftp-deploy/spec.md) (depends on T010). Confirmed 2026-08-18: the same `lftp` listing shows only `cv-en-2026-08-18.pdf/docx` and `cv-sv-2026-08-18.pdf/docx` — the stale `2026-06-01`-dated files seen in the earlier (misdirected) deploy are gone. `about/` was **not** removed by this cleanup (expected — it only targets `cv-*.pdf`/`cv-*.docx`, not arbitrary stale directories, per [FR-010 in 003](../003-ftp-deploy/spec.md) scope) and was deleted manually by the maintainer instead.
- [ ] T012 [P] [US3] List the domain root's contents before and after running `npm run deploy:full` and confirm they are identical — confirms [SC-005](spec.md) / [SC-007 in 003](../003-ftp-deploy/spec.md) (deploy touches nothing outside `/cv`) (depends on T010). Not directly observed — no before/after listing of the domain root (one level above `/cv`) has been taken. Low risk: `uploadSite()`/`cleanupOldPdfs()`/`cleanupOldDocx()` are all parameterized on `cfg.remoteDir` with no code path touching its parent (per [research R6](research.md#r6-deploy-tool-changes-required)), so this is expected to hold; a quick `ls` one level up from `/cv` would close it out fully.
- [X] T016 [US3] **Post-deploy correction**: the first production deploy (2026-08-18) succeeded but uploaded to the wrong server-side location — `FTP_REMOTE_DIR=/cv` was interpreted relative to the FTP session's own root, which on this host is the shared hosting account root, not the domain's `public_html/`. Diagnosed via `curl --ftp-ssl -Q "PWD" -Q "CWD /malte.sarner.se/public_html/cv" -Q "PWD"` (see [research R7](research.md#r7-ftp_remote_dir-is-a-filesystem-path-not-the-sites-url-path)). Corrected `FTP_REMOTE_DIR` in `.env.local` to `/malte.sarner.se/public_html/cv`; updated [FR-011](spec.md), [data-model.md](data-model.md), [quickstart.md](quickstart.md), `README.md`, and [003's quickstart.md](../003-ftp-deploy/quickstart.md) to state the requirement in terms of what the path must resolve to, not the literal `/cv` string. T010–T012 still need to be (re)run against the corrected value.

**Checkpoint**: Deploying updates the real, Apache-served `/cv` only. The domain root — including the redirect file from User Story 2 — is never touched by the deploy command.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Documentation required by FR-014/FR-015 so the subdirectory layout and manual steps are discoverable without inspecting the server

- [X] T013 [P] Update `README.md`: state `/cv` as the deployed subdirectory, `FTP_REMOTE_DIR=/cv` as the configured value (replacing the generic `FTP_REMOTE_DIR=/` example), and document the one-time manual step of placing `deploy/root.htaccess` at the domain root — per [FR-014](spec.md). **⚠ Corrected 2026-08-18 alongside T016**: the FTP value is now documented as host-dependent, with a `curl --ftp-ssl` diagnostic to verify it, not asserted as a portable literal.
- [X] T014 [P] Update `specs/003-ftp-deploy/quickstart.md` line 26 (`FTP_REMOTE_DIR=/`) to reflect `/cv` as the value in use for this deployment — per [FR-015 in 003](../003-ftp-deploy/spec.md). **⚠ Corrected 2026-08-18 alongside T016**, same as above.
- [X] T015 Run through [quickstart.md](quickstart.md) end to end as a final sanity check, confirming every step's expected outcome — in particular the one-time manual migration of old root content (step 6), which is explicitly out of tooling scope per [FR-013](spec.md)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **User Story 1 (Phase 2)**: Depends on Setup (T001). This is the MVP — the site must work under `/cv` before the redirect (US2) or the deploy (US3) are meaningful to verify end-to-end.
- **User Story 2 (Phase 3)**: T007 (file creation) is independent of User Story 1 — different artifact, different location. T008 (live verification) depends on User Story 3's deploy (T010) actually putting the site at `/cv` on the server.
- **User Story 3 (Phase 4)**: T009 (the env var edit) is independent and can happen any time. T010 (the actual deploy) depends on User Story 1's code (T002, T003) being correct, since it deploys that build.
- **Polish (Phase 5)**: Independent of all three stories' verification steps; can be done any time after the values it documents are settled (T001, T009).

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories. Fully independently testable locally (T002–T006) without any server access.
- **User Story 2 (P1)**: Artifact creation (T007) is independent. End-to-end verification (T008) needs User Story 3 done first, since it needs a live `/cv` to redirect to.
- **User Story 3 (P2)**: Its config change (T009) is independent of everything else. Its verification (T010) needs User Story 1's code changes to be correct, since it deploys that build.

### Parallel Opportunities

- T002 and T003 (different files: `next.config.mjs` vs `components/Menu.tsx`) can run in parallel once T001 is done.
- T005 can run in parallel with T004 (different verification targets: dev server vs. built export).
- T007 (root htaccess file) can be written in parallel with all of User Story 1 — it has no code dependency.
- T009 (setting `FTP_REMOTE_DIR`) has no dependency at all and can be done any time, in parallel with Setup or any user story.
- T011 and T012 can run in parallel once T010 is done (different things being checked: PDF/DOCX cleanup vs. domain-root contents).
- T013 and T014 (different files) can run in parallel.

---

## Parallel Example: User Story 1

```bash
# After T001 (.env.production created), launch together:
Task: "Add basePath to next.config.mjs"
Task: "Prefix the 4 download anchors in components/Menu.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001).
2. Complete Phase 2: User Story 1 (T002–T006).
3. **STOP and VALIDATE**: the site works correctly at `/cv/` when served locally — this is verifiable entirely without touching the production server.

### Incremental Delivery

1. Setup → User Story 1 → validate locally (MVP: the site is subdirectory-ready).
2. Add User Story 2's artifact (T007) → can happen any time, no ordering constraint with US1.
3. Add User Story 3 (T009–T012) → deploys US1's build to the real `/cv` on the server.
4. Complete User Story 2's live verification (T008) → now that `/cv` is live, confirm the root redirect terminates correctly.
5. Polish (T013–T015) → documentation and final end-to-end sanity pass.
