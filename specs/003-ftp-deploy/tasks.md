# Tasks: FTP Deploy

**Input**: Design documents from `/specs/003-ftp-deploy/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Not requested in spec — test tasks omitted.

**Organization**: Tasks grouped by user story. US3 (Build-and-Deploy) is covered by the `deploy:full` npm script added in Setup. US4 (Remote Directory) is covered by the `FTP_REMOTE_DIR` config added in US2. US5 (Security Headers) is a new cross-cutting concern addressing FR-011/FR-012.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US5)
- Exact file paths included in descriptions

---

## Phase 1: Setup

**Purpose**: Install dependencies, add npm scripts, configure environment variables

- [x] T001 Install `basic-ftp` and `dotenv` as devDependencies in package.json
- [x] T002 [P] Add `deploy` and `deploy:full` npm scripts to package.json (`"deploy": "tsx tools/deploy-ftp.ts"`, `"deploy:full": "npm run export && npm run deploy"`)
- [x] T003 [P] Add FTP_HOST, FTP_USER, FTP_PASS, FTP_REMOTE_DIR placeholder variables to .env.local

---

## Phase 2: US2 — Credentials via Environment Variables (Priority: P1)

**Goal**: FTP credentials are loaded from `.env.local` and validated before any connection attempt.

**Independent Test**: Run `npm run deploy` with missing env vars → script exits immediately with a clear error naming the missing variable(s).

### Implementation for User Story 2

- [x] T004 [US2] Create tools/deploy-ftp.ts with dotenv loading from .env.local at script entry
- [x] T005 [US2] Define FtpConfig interface and loadConfig() function that reads FTP_HOST, FTP_USER, FTP_PASS (required) and FTP_REMOTE_DIR (optional, default `/`) from process.env in tools/deploy-ftp.ts
- [x] T006 [US2] Implement validateConfig() that exits with process.exit(1) and descriptive error message listing all missing required variables in tools/deploy-ftp.ts

**Checkpoint**: Running `npm run deploy` without FTP env vars prints "Missing required environment variable: FTP_HOST, FTP_USER, FTP_PASS" and exits with code 1.

---

## Phase 3: US1 — Deploy Site with Single Command (Priority: P1) 🎯 MVP

**Goal**: `npm run deploy` uploads the entire `out/` directory to the configured FTP server with progress output.

**Independent Test**: Build the site with `npm run export`, run `npm run deploy` with valid FTP credentials, verify files appear on the FTP server and the live site reflects the build.

### Implementation for User Story 1

- [x] T007 [US1] Implement validateBuildOutput() that checks `out/` directory exists and is non-empty, exits with process.exit(1) and clear error if missing in tools/deploy-ftp.ts
- [x] T008 [US1] Implement connectFtp() that attempts FTPS (secure: true) first, catches TLS errors and falls back to plain FTP (secure: false), exits with process.exit(1) on connection/auth failure in tools/deploy-ftp.ts
- [x] T009 [US1] Implement uploadSite() that uses client.uploadFromDir() to recursively upload `out/` to the configured remote directory, with client.trackProgress() logging each file transferred in tools/deploy-ftp.ts (note: uploadFromDir() auto-creates remote directories, resolving the "remote dir does not exist" edge case)
- [x] T010 [US1] Implement main() entry point that orchestrates: loadConfig → validateConfig → validateBuildOutput → connectFtp → uploadSite → print summary (files uploaded, duration) → close connection → process.exit(0 or 1) in tools/deploy-ftp.ts

**Checkpoint**: `npm run deploy` uploads the full static site and prints a success summary with file count and duration.

---

## Phase 4: US5 — Security Headers via .htaccess (FR-011, FR-012)

**Goal**: The deployed site returns security response headers (X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security, Content-Security-Policy, Referrer-Policy, Permissions-Policy) configured via an Apache `.htaccess` file.

**Independent Test**: After deploying, run `curl -I https://your-domain.se` and verify all six security headers are present in the response.

### Implementation for User Story 5

- [ ] T013 [US5] Create public/.htaccess with `<IfModule mod_headers.c>` wrapper containing headers: X-Frame-Options DENY, X-Content-Type-Options nosniff, Strict-Transport-Security max-age=31536000 includeSubDomains, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy disabling unused device APIs (accelerometer, camera, geolocation, gyroscope, magnetometer, microphone, payment, usb)
- [ ] T014 [US5] Add Content-Security-Policy header to public/.htaccess with directives: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://api.emailjs.com; object-src 'none'; base-uri 'self'; frame-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests
- [ ] T015 [US5] Verify public/.htaccess is copied to out/ by running `npm run export` and confirming `out/.htaccess` exists with correct content

**Checkpoint**: `npm run export` produces `out/.htaccess` with all security headers. After deploy, `curl -I` confirms headers are served by Apache.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Documentation and validation

- [x] T011 [P] Update README.md with FTP deploy setup instructions (env vars, npm run deploy, npm run deploy:full)
- [x] T012 Run quickstart.md validation: follow quickstart steps on a clean setup to verify end-to-end deploy works
- [ ] T016 [P] Deploy site via `npm run deploy:full` and verify security headers with `curl -I https://your-domain.se`
- [ ] T017 Check browser console on live site for CSP violation errors; adjust CSP directives in public/.htaccess if any resources are blocked

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately ✅ DONE
- **US2 (Phase 2)**: Depends on T001 (deps installed) and T002 (npm script registered) ✅ DONE
- **US1 (Phase 3)**: Depends on Phase 2 completion (config loading must work before deploy logic) ✅ DONE
- **US5 (Phase 4)**: No code dependencies on other phases — static file in `public/`. Can start immediately.
- **Polish (Phase 5)**: T016 depends on Phase 4 completion (needs .htaccess in place before verifying headers)

### User Story Dependencies

- **US2 (P1)**: Foundational — credential loading/validation is required by all other stories ✅ DONE
- **US1 (P1)**: Depends on US2 — needs valid credentials to connect ✅ DONE
- **US3 (P2)**: **Fully covered by T002** — `deploy:full` npm script chains `npm run export && npm run deploy`. No additional tasks needed. ✅ DONE
- **US4 (P2)**: **Fully covered by T005 + T009** — `FTP_REMOTE_DIR` is read in config and passed to `uploadFromDir()`. No additional tasks needed. ✅ DONE
- **US5 (Security Headers)**: Independent — static file in `public/`, no dependency on deploy script logic

### Within Phase 4 (US5)

- T013 → T014 (sequential: create file with basic headers, then add CSP directive)
- T015 depends on T013 + T014 (verify the complete file)

### Parallel Opportunities

- Phase 4 (US5) can run in parallel with any remaining work (different file: `public/.htaccess`)
- T016 and T017 can run sequentially after deploy but are independent of each other in scope

---

## Implementation Strategy

### Current State

Phases 1–3 are complete (T001–T010 done). The core deploy feature is fully functional. The remaining work is:

1. Complete Phase 4: US5 — Create `.htaccess` with security headers (T013–T015)
2. Complete Phase 5: Deploy and verify headers on live site (T016–T017)

### MVP Scope

The deploy feature (US1 + US2) is the MVP and is already complete. Security headers (US5) are an incremental hardening step.

---

## Notes

- All deploy implementation is in a single file: `tools/deploy-ftp.ts` (complete)
- Security headers implementation is in a single file: `public/.htaccess`
- US3 and US4 require zero additional code beyond what's in Setup and US2
- No test tasks generated (not requested in spec)
- CSP must allow: Google Fonts (googleapis.com + gstatic.com) and EmailJS API (api.emailjs.com)
- Commit after each phase for clean history
