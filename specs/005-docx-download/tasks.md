# Tasks: DOCX Download

**Input**: Design documents from `/specs/005-docx-download/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/cli-and-ui.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: Install dependencies and register npm scripts

- [ ] T001 Add `docx` as a devDependency in package.json (`npm install --save-dev docx`)
- [ ] T002 Add `docx:build` script to package.json resolving to `tsx tools/build-docx.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Content label additions needed by both US1 (DOCX build reads date) and US2 (dropdown reads labels)

**⚠️ CRITICAL**: US2 depends on these content fields being available in site-content.json

- [ ] T003 Add `ui.nav.download` and `ui.nav.word` localized strings to tools/build-content.ts (en: "Download"/"Word", sv: "Ladda ned"/"Word") following the existing pattern for `ui.nav.pdf`
- [ ] T004 Run `npm run content:build` and verify `ui.nav.download`, `ui.nav.word`, and `ui.pdf.date` appear in public/content/site-content.json

**Checkpoint**: Content schema updated — user story implementation can begin

---

## Phase 3: User Story 1 — Build-time DOCX generation (Priority: P1) 🎯 MVP

**Goal**: A single command generates Word documents of the CV for each language from site-content.json

**Independent Test**: Run `npm run docx:build`, verify `cv-en-YYYY-MM-DD.docx` and `cv-sv-YYYY-MM-DD.docx` appear in `public/` with correct content and styling

### Implementation for User Story 1

- [ ] T005 [US1] Create tools/build-docx.ts with: read site-content.json, validate `ui.pdf.date` exists, delete existing `cv-*.docx` from `public/`, iterate languages (en, sv)
- [ ] T006 [US1] Implement DOCX document construction in tools/build-docx.ts: Document with single Section containing person name (Heading1, Cambria), role (Normal, bold, uppercase, Calibri), summary paragraphs (Normal, Calibri)
- [ ] T007 [US1] Add education section to tools/build-docx.ts: Heading2 for section title, then for each entry: organization+period (bold), title (italic), description
- [ ] T008 [US1] Add roles section to tools/build-docx.ts: Heading2 for section title, then for each role entry: organization+period (bold), title (italic), description
- [ ] T009 [US1] Add assignments section to tools/build-docx.ts: Heading2 for section title, then for each assignment: organization/client+period (bold), title (italic), description, "Technologies: tech1, tech2, ..." line (only if technologies array is non-empty)
- [ ] T010 [US1] Add global technologies section to tools/build-docx.ts: Heading2 for section title, then for each category: "Category: tech1, tech2, ..." paragraph
- [ ] T011 [US1] Add Packer.toBuffer() and writeFileSync() output in tools/build-docx.ts with informational stdout per the CLI contract (=== DOCX Build ===, file count, output directory)
- [ ] T012 [US1] Add error handling in tools/build-docx.ts: exit 1 with stderr message if site-content.json is missing/unreadable or `ui.pdf.date` is not found

**Checkpoint**: `npm run docx:build` generates valid DOCX files — open in Word/LibreOffice to verify content and fonts

---

## Phase 4: User Story 2 — Download dropdown UI (Priority: P1)

**Goal**: Navigation shows a "Download" dropdown with PDF and Word format options

**Independent Test**: Run `npm run content:build && npm run dev`, visit site, click Download button, verify dropdown shows PDF and Word links pointing to correct files for current language

### Implementation for User Story 2

- [ ] T013 [US2] Update the MenuProps interface in components/Menu.tsx to accept `navLabels.download` and `navLabels.word` (LocalizedText), keeping existing `pdf` label
- [ ] T014 [US2] Implement desktop download dropdown in components/Menu.tsx: button labeled `navLabels.download[lang]` positioned after Contact link, dropdown panel with two `<a download>` links (PDF: `/cv-{lang}-{pdfDate}.pdf`, Word: `/cv-{lang}-{pdfDate}.docx`)
- [ ] T015 [US2] Add useState for dropdown open/close and useEffect click-outside handler to close dropdown in components/Menu.tsx
- [ ] T016 [US2] Add route-change close behavior (usePathname or useEffect) for the dropdown in components/Menu.tsx
- [ ] T017 [US2] Update mobile navigation in components/HamburgerDrawer.tsx: render PDF and Word as separate nav-style `<a download>` links (no sub-dropdown) using the same labels and hrefs
- [ ] T018 [US2] Update the server component that provides props to Menu (app/[lang]/layout.tsx or equivalent) to pass the new `download` and `word` nav labels from site-content.json

**Checkpoint**: Download dropdown works on desktop and mobile, links point to correct language files, dropdown closes on click-outside and route change

---

## Phase 5: User Story 3 — Deploy workflow integration (Priority: P2)

**Goal**: Full deploy command includes DOCX generation in the correct pipeline order

**Independent Test**: Run `npm run deploy:full` (or inspect the script definition) and verify the order is content:build → pdf:build → docx:build → next build → deploy

### Implementation for User Story 3

- [ ] T019 [US3] Update `deploy:full` script in package.json to include `npm run docx:build` after `pdf:build` and before `next build`

**Checkpoint**: `npm run deploy:full` executes the full pipeline in correct order; a DOCX build failure halts the pipeline

---

## Phase 6: User Story 4 — Server cleanup of stale DOCX files (Priority: P2)

**Goal**: Deploy removes outdated DOCX files from the remote server

**Independent Test**: Deploy with new DOCX files, verify old dated `.docx` files are removed from the server

### Implementation for User Story 4

- [ ] T020 [US4] Extend cleanup logic in tools/deploy-ftp.ts to also remove remote files matching `cv-*.docx` that do not match the current build's filenames (follow existing pattern used for `cv-*.pdf`)

**Checkpoint**: After deploy, only current build's DOCX files remain on server

---

## Phase 7: User Story 5 — --skip-latest-role flag parity (Priority: P2)

**Goal**: DOCX build tool supports `--skip-latest-role` flag matching PDF tool behavior

**Independent Test**: Run `npm run docx:build -- --skip-latest-role`, verify output is named `cv-{lang}-{date}-nolatestrole.docx` and the most recent role entry is absent from the document

### Implementation for User Story 5

- [ ] T021 [US5] Add `--skip-latest-role` CLI argument parsing in tools/build-docx.ts (use process.argv or same pattern as build-pdf.ts)
- [ ] T022 [US5] When `--skip-latest-role` is set: filter out the most recent role entry (by date) from the roles array before document construction, and append `-nolatestrole` to the output filename

**Checkpoint**: Flag produces correctly named files with the latest role omitted

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all stories

- [ ] T023 Run full pipeline (`npm run content:build && npm run docx:build && npm run dev`) and verify Download dropdown works end-to-end with real generated files
- [ ] T024 Open generated DOCX files in Word/LibreOffice and verify: Cambria headings, Calibri body, all sections present, technologies lines on assignments only
- [ ] T025 Test language switching: verify dropdown links update to correct language files when switching en↔sv
- [ ] T026 Run quickstart.md validation steps end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (docx package installed)
- **US1 (Phase 3)**: Depends on Phase 2 (needs `ui.pdf.date` in site-content.json)
- **US2 (Phase 4)**: Depends on Phase 2 (needs nav labels in site-content.json)
- **US3 (Phase 5)**: Depends on US1 being complete (script must exist to include in pipeline)
- **US4 (Phase 6)**: Depends on US1 being complete (must know DOCX filename pattern)
- **US5 (Phase 7)**: Depends on US1 being complete (extends the build tool)
- **Polish (Phase 8)**: Depends on all previous phases

### User Story Independence

- **US1 and US2** can proceed in parallel after Phase 2 (different files: `tools/build-docx.ts` vs `components/Menu.tsx`)
- **US3, US4, US5** can proceed in parallel after US1 is complete (different files: `package.json`, `tools/deploy-ftp.ts`, `tools/build-docx.ts`)

### Within User Story 1

- T005 (scaffold) → T006–T010 (sections, can be done sequentially in one file) → T011 (output) → T012 (error handling)

### Parallel Opportunities

```text
After Phase 2 completes:
  ├── US1: T005 → T006 → T007 → T008 → T009 → T010 → T011 → T012 (tools/build-docx.ts)
  └── US2: T013 → T014 → T015 → T016 (components/Menu.tsx)
           T017 (components/HamburgerDrawer.tsx) [P] with T014–T016
           T018 (app/[lang]/layout.tsx)

After US1 completes:
  ├── US3: T019 (package.json)
  ├── US4: T020 (tools/deploy-ftp.ts)
  └── US5: T021 → T022 (tools/build-docx.ts)
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (install docx, add script)
2. Complete Phase 2: Foundational (content labels)
3. Complete Phase 3: US1 — DOCX generation works
4. Complete Phase 4: US2 — Dropdown UI works
5. **STOP and VALIDATE**: Build DOCX files, run dev server, verify full download flow
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Test DOCX generation independently → MVP backend ✓
3. Add US2 → Test dropdown independently → MVP frontend ✓ (full MVP!)
4. Add US3 → Pipeline automation
5. Add US4 → Server cleanup
6. Add US5 → Flag parity with PDF tool
