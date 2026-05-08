# Tasks: PDF Download

**Input**: Design documents from `/specs/004-pdf-download/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/cli.md, quickstart.md

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Install dependencies and register npm scripts needed for PDF generation

- [x] T001 Add puppeteer devDependency and `pdf:build` npm script to package.json

---

## Phase 2: User Story 1 — Generate PDF versions of the CV at build time (Priority: P1) 🎯 MVP

**Goal**: A single `npm run pdf:build` command reads `site-content.json`, renders an HTML template per language via Puppeteer, and writes `cv-{lang}-YYYY-MM-DD.pdf` files to `public/`.

**Independent Test**: Run `npm run content:build && npm run pdf:build`, then verify `public/cv-en-*.pdf` and `public/cv-sv-*.pdf` exist and contain all CV sections (summary, education, positions, assignments, technologies by category).

### Implementation for User Story 1

- [x] T002 [US1] Create tools/build-pdf.ts — read site-content.json (including `ui.pdf.date` for the filename date), delete old cv-\*.pdf from public/, launch Puppeteer, render HTML template (inline CSS with Google Fonts Fraunces + Instrument Sans, A4 layout with 20mm margins, site color palette), generate one PDF per language, close browser

**Checkpoint**: `npm run pdf:build` produces two correctly named and styled PDFs in `public/`

---

## Phase 3: User Story 2 — Download PDF from the website navigation (Priority: P1)

**Goal**: A download link appears in the desktop and mobile navigation (after Contact) pointing to the current language's PDF file.

**Independent Test**: Run `npm run content:build` (to get ui.nav.pdf label), start the dev server, and verify the PDF link is visible in both desktop nav and hamburger drawer, with correct href for the active language.

### Implementation for User Story 2

- [x] T003 [P] [US2] Add `ui.nav.pdf` localized strings ("Download PDF" / "Ladda ner PDF") and `ui.pdf.date` field (YYYY-MM-DD from build date) to tools/build-content.ts
- [x] T004 [P] [US2] Add PDF download `<a>` element (with `download` attribute, href `/cv-{lang}-{date}.pdf` where date is read from `ui.pdf.date` in site-content.json, label from ui.nav.pdf) after Contact link in components/Menu.tsx — pass `pdfDate` as prop from the server component ([lang]/layout.tsx or Header.tsx)

**Checkpoint**: Navigation shows a PDF download link that updates href when language changes

---

## Phase 4: User Story 3 — PDF generation included in full deploy workflow (Priority: P2)

**Goal**: The `deploy:full` npm script includes PDF generation so PDFs are always fresh when deploying.

**Independent Test**: Run `npm run deploy:full` (or inspect the script definition) and verify the build order is `content:build` → `pdf:build` → `next build` → `deploy`, with PDFs included in the static export automatically.

### Implementation for User Story 3

- [x] T005 [US3] Update deploy:full script in package.json to: `npm run content:build && npm run pdf:build && next build && npm run deploy` (PDFs are in `public/` before `next build`, so they're exported automatically — no copy step needed)

**Checkpoint**: `npm run deploy:full` generates fresh PDFs and includes them in the upload directory

---

## Phase 5: User Story 4 — Old PDF files cleaned up on the server during deployment (Priority: P2)

**Goal**: After FTP upload, stale `cv-*.pdf` files (from previous build dates) are deleted from the remote server.

**Independent Test**: Deploy with new PDFs, then list remote `cv-*.pdf` files and verify only the current build date's files remain.

### Implementation for User Story 4

- [x] T006 [US4] Add server-side PDF cleanup to tools/deploy-ftp.ts — after upload, list remote files matching `cv-*.pdf`, delete any that don't match current build's filenames, log results

**Checkpoint**: After deploy, only current-date PDF files remain on the server

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all stories

- [x] T007 Run quickstart.md validation — execute full workflow (`content:build` → `pdf:build` → verify PDFs → check nav link → `deploy:full`) and confirm all acceptance criteria pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **US1 (Phase 2)**: Depends on Setup (needs puppeteer + npm script)
- **US2 (Phase 3)**: Independent of Setup — only modifies build-content.ts and Menu.tsx
- **US3 (Phase 4)**: Depends on US1 (deploy:full calls pdf:build)
- **US4 (Phase 5)**: Independent — modifies deploy-ftp.ts only
- **Polish (Phase 6)**: Depends on all stories being complete

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 1 only — no other story dependencies
- **US2 (P1)**: No dependencies on other stories (link may 404 without US1, which is acceptable per spec)
- **US3 (P2)**: Depends on US1 (script references pdf:build)
- **US4 (P2)**: No dependencies on other stories

### Parallel Opportunities

- **US1 and US2** can be implemented in parallel (different files: tools/build-pdf.ts vs build-content.ts + Menu.tsx)
- **US4** can be implemented in parallel with US1/US2 (different file: deploy-ftp.ts)
- Within US2: T003 and T004 can run in parallel (different files)

---

## Parallel Example: User Stories 1 + 2 + 4

```bash
# After Phase 1 (Setup) is complete, launch in parallel:
Task T002: "Create tools/build-pdf.ts ..."        # US1 — new file
Task T003: "Add ui.nav.pdf strings ..."           # US2 — build-content.ts
Task T004: "Add PDF download <a> element ..."     # US2 — Menu.tsx
Task T006: "Add server-side PDF cleanup ..."      # US4 — deploy-ftp.ts

# Then sequentially:
Task T005: "Update deploy:full script ..."        # US3 — depends on US1
Task T007: "Run quickstart.md validation"         # Polish — depends on all
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: US1 (T002)
3. **STOP and VALIDATE**: Run `npm run pdf:build` and open the generated PDFs
4. PDFs exist and look correct → MVP achieved

### Incremental Delivery

1. Setup → pdf:build works (US1 ✓)
2. Add nav link (US2 ✓) → visitors can download
3. Automate in deploy (US3 ✓) → no manual steps
4. Server cleanup (US4 ✓) → no stale files accumulate
5. Polish → full validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- The mockup (specs-input/mockup/scandinavian.html) already has the PDF nav link — use it as reference for placement and styling in Menu.tsx
