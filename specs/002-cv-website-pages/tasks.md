# Tasks: Static CV Website Pages

**Input**: Design documents from `/specs/002-cv-website-pages/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Exact file paths included in descriptions

---

## Phase 1: Setup

**Purpose**: Project initialization — ensure dependencies, config, and build pipeline are ready.

- [x] T001 Verify Next.js project structure matches plan in next.config.mjs (output: "export", trailingSlash: true)
- [x] T002 [P] Ensure global CSS in app/globals.css imports mockup design tokens (--white, --off, --line, --text, --mid, --accent, --accent-light, --warm) and Fraunces + Instrument Sans fonts per FR-004b
- [x] T003 [P] Ensure language types and helpers in lib/i18n/lang.ts export LANGUAGES array ["en","sv"], Language type, isValidLanguage(), and DEFAULT_LANGUAGE = "en" per FR-005/FR-006
- [x] T004 [P] Ensure content loader in lib/content/loadContent.ts imports and re-exports typed SiteContent from public/content/site-content.json

**Checkpoint**: Project builds, dev server starts, design tokens and font imports are in place.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Content pipeline and shared layout that ALL user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T005 Ensure build tool tools/build-content.ts parses specs-input/cv/ entries, partitions by type (education, employee/consultant/voluntary/national → roles, assignment → assignments), sorts newest-first by sortKey, and outputs public/content/site-content.json per FR-014/FR-015/FR-016/FR-017
- [x] T006 [P] Ensure build tool generates ui section in site-content.json with all required i18n keys: ui.nav.{cv,technologies,about,contact}, ui.cv.{sections.{education,roles,assignments}, searchPlaceholder, clearSearch, showAll, noResults, present}, ui.contact.{intro,fields.{name,email,subject,message},submit,success,error} per FR-003/FR-011a/FR-011b/FR-018a/FR-018b/FR-018c/FR-024a/FR-026
- [x] T007 [P] Ensure build tool generates about.text from specs-input/about/{en,sv}.txt per FR-025
- [x] T008 [P] Ensure build tool generates notFound.title and notFound.text from specs-input/not-found/{en,sv}.txt per FR-031
- [x] T009 [P] Ensure build tool generates technologies section in site-content.json by intersecting tech-categories.json with CV entry Technologies fields; for each technology compute total years of experience by summing duration of every CV entry whose Technologies field includes it (duration = months between period start and period end ÷ 12, rounded to nearest integer; ongoing entries use build date as end); technologies with 0 years still included; unmapped techs go to "Other" (rendered last); output as Record<string, TechItem[]> where TechItem = { name: string, years: number } per FR-037 in tools/build-content.ts
- [x] T010 [P] Ensure build tool generates person.name and person.role from specs-input/cv/summary/meta.txt per FR-002
- [x] T011 Validate generated site-content.json against contracts/site-content.schema.json using tools/validate-content.ts
- [x] T012 Implement root layout in app/layout.tsx with html/body wrapper, font imports, and globals.css
- [x] T013 Implement root page in app/page.tsx to redirect / → /en/ per FR-011
- [x] T014 Implement language layout in app/[lang]/layout.tsx with generateStaticParams for ["en","sv"], language validation, and content loading per FR-005/FR-007
- [x] T015 Implement Header component in components/Header.tsx with sticky nav bar containing: nav-name-block (Role eyebrow + "Malte Särner" name), nav links (CV/Technologies/About/Contact from ui.nav), and language toggle — all matching mockup per FR-002/FR-003/FR-004/FR-004a/FR-004b/FR-010
- [x] T016 [P] Implement Menu component in components/Menu.tsx with active page indication sourcing labels from site-content.json → ui.nav.<page>[lang] per FR-003/FR-004
- [x] T017 Ensure "Open to work" badge from mockup is NOT included per FR-003a

**Checkpoint**: Content pipeline generates valid site-content.json with technologies containing { name, years } objects. Root redirect works. Language layout renders with nav bar on all pages. Language toggle switches between /en/ and /sv/.

---

## Phase 3: User Story 1 — Navigate site pages + language (Priority: P1) 🎯 MVP

**Goal**: Visitor can navigate between CV, Technologies, About, and Contact pages and switch language.

**Independent Test**: Open / → redirected to /en/; click each nav link → correct page; switch language → URL and content update.

### Implementation for User Story 1

- [x] T018 [US1] Implement CV page in app/[lang]/page.tsx loading content and rendering h1 title from ui.nav.cv[lang] per FR-011/FR-011b/FR-012
- [x] T019 [P] [US1] Implement About page in app/[lang]/about/page.tsx rendering h1 from ui.nav.about[lang] and about text from about.text[lang] per FR-025/FR-011b
- [x] T020 [P] [US1] Implement Contact page shell in app/[lang]/contact/page.tsx rendering h1 from ui.nav.contact[lang] per FR-011b (form in US3)
- [x] T021 [P] [US1] Implement Technologies page shell in app/[lang]/technologies/page.tsx rendering h1 from ui.nav.technologies[lang] per FR-011b (content in US4)
- [x] T022 [P] [US1] Implement non-prefixed redirect pages: app/about/page.tsx, app/contact/page.tsx, app/technologies/page.tsx each redirecting to /en/<route> per FR-008
- [x] T023 [US1] Implement not-found page in app/not-found.tsx rendering h1 from notFound.title.en and body from notFound.text.en (defaults to English) per FR-031/FR-011b
- [x] T024 [US1] Implement language toggle in Header switching between /en/ and /sv/ for same page per FR-009/FR-010

**Checkpoint**: All 4 pages render with correct h1 titles from site-content.json. Nav links navigate between pages with active indication. Language toggle switches URL and content language. Non-prefixed routes redirect to /en/. Unknown routes show 404.

---

## Phase 4: User Story 2 — Read CV summary + categorized experience lists (Priority: P2)

**Goal**: CV page shows summary text, Education/Roles/Assignments lists newest-first, show-5 default, expand/collapse.

**Independent Test**: Open CV page → summary shown; 3 sections in order; lists newest-first; >5 items shows "Show all"; click item → expands description.

### Implementation for User Story 2

- [x] T025 [US2] Render summary text block on CV page from cv.summary[lang] below h1, no hero wrapper per FR-012/FR-013
- [x] T026 [US2] Implement CvSections component in components/CvSections.tsx rendering Education, Roles, Assignments sections in order with section headings from ui.cv.sections.<key>[lang] per FR-012/FR-018b
- [x] T027 [P] [US2] Implement CV list item rendering: ItemLabel left + Period right per row; Roles use role field (FR-020), Education/Assignments use title[lang] (FR-019); sub-row shows organization · client · location per FR-018/FR-004b
- [x] T028 [US2] Implement period display: full range for roles/assignments with "present"/"Nuvarande" from ui.cv.present[lang] for open-ended (FR-018a); graduation year only for education entries (FR-018d)
- [x] T029 [US2] Implement show-5 default with "Show all" control sourcing label from ui.cv.showAll[lang]; hidden when ≤5 items per FR-021/FR-022/FR-023/FR-018c
- [x] T030 [US2] Implement expand/collapse on CV list item click revealing description body from active language per FR-024
- [x] T031 [US2] Apply mockup visual styling to CV list sections matching scandinavian.html patterns (card borders, spacing, typography) per FR-004b/FR-018b

**Checkpoint**: CV page shows summary + 3 list sections. Lists sorted newest-first. >5 items collapsed with "Show all". Click expands description. All labels from site-content.json.

---

## Phase 5: User Story 2b — Search experience lists (Priority: P2)

**Goal**: Search bar on CV page filters all list sections by keyword(s).

**Independent Test**: Type keyword → matching entries shown; multiple words → AND match; clear → all restored; no matches → "no results" indicator.

### Implementation for User Story 2b

- [x] T032 [US2b] Implement CvPageClient component in components/CvPageClient.tsx as client component managing search state per FR-011a
- [x] T033 [US2b] Implement search bar UI below summary, above list sections, matching mockup styling; placeholder from ui.cv.searchPlaceholder[lang], clear button aria-label from ui.cv.clearSearch[lang] per FR-011a/FR-012
- [x] T034 [US2b] Implement multi-word AND search filtering across period, title/role, organization, client, location, description[lang] (case-insensitive) per US2b acceptance scenario 2
- [x] T035 [US2b] Implement "no results" indicator per section when search yields no matches, sourcing label from ui.cv.noResults[lang] per FR-024a
- [x] T036 [US2b] When search is active, show all matching items (bypass show-5 limit) per US2b behavior

**Checkpoint**: Search filters all 3 sections. Multi-word AND match works. Clear restores all. Empty sections show "no results".

---

## Phase 6: User Story 3 — Send a contact message (Priority: P3)

**Goal**: Contact form with Name/Email/Subject/Message sends email via EmailJS.

**Independent Test**: Submit empty → validation errors; submit valid → EmailJS send + success state; send fails → error state with retry.

### Implementation for User Story 3

- [x] T037 [US3] Implement ContactForm component in components/ContactForm.tsx with Name, Email, Subject, Message fields — all required; field labels, submit button, success/error messages sourced from ui.contact[lang] per FR-026/FR-027
- [x] T038 [US3] Implement client-side validation: block submit when any field empty, show field-level errors per FR-027
- [x] T039 [US3] Implement EmailJS integration reading NEXT_PUBLIC_EMAILJS_PUBLIC_KEY, NEXT_PUBLIC_EMAILJS_SERVICE_ID, NEXT_PUBLIC_EMAILJS_TEMPLATE_ID from env; fail gracefully with error state if missing per FR-028/FR-030
- [x] T040 [US3] Implement success confirmation state after successful send per FR-029
- [x] T041 [US3] Implement failure state with retry guidance on send error per FR-030
- [x] T042 [US3] Apply mockup visual styling to contact form matching scandinavian.html contact form patterns per FR-004b
- [x] T043 [US3] Wire ContactForm into app/[lang]/contact/page.tsx

**Checkpoint**: Contact form validates all fields. EmailJS sends on valid submit. Success/error states work. Missing env vars show error gracefully.

---

## Phase 7: User Story 4 — Browse technologies by category (Priority: P3)

**Goal**: Technologies page shows an interactive chart of all used technologies with progress bars, category filter buttons, and a sort toggle.

**Independent Test**: Open /en/technologies → flat chart of technology rows with progress bars and years labels; click a category filter button → only that category shown; click "All" → all shown; toggle sort to "A–Z" → alphabetical, toggle to "Time" → years descending; /technologies redirects to /en/technologies.

### Implementation for User Story 4

- [x] T044 [US4] Implement TechChart client component in components/TechChart.tsx rendering a flat chart of technology rows: fixed-width technology name on the left, 6px horizontal progress bar in the centre (width = years/maxYears × 100% where maxYears is the maximum across all technologies), and right-aligned years label (e.g. "8 yrs"; "< 1 yr" for zero-years techs) per FR-034/FR-037
- [x] T045 [US4] Implement progress bar four-tier colour gradient in components/TechChart.tsx: ≥12 years #1a6b4a, ≥7 years #2d9b6f, ≥3 years #6bbea0, <3 years #a8d8c8 per FR-035
- [x] T046 [P] [US4] Implement category filter buttons above the chart in components/TechChart.tsx: "All" button followed by one button per non-empty category in tech-categories.json key order ("Other" last if present); clicking a category filters chart to that category only; clicking "All" shows all; active button uses accent styling matching mockup per FR-034a/FR-036
- [x] T047 [P] [US4] Implement sort toggle as right-aligned segmented control within the filter row in components/TechChart.tsx: "Time" (years descending — default) and "A–Z" (alphabetical ascending); active option uses dark background / white text per mockup per FR-034b
- [x] T048 [US4] Wire TechChart into app/[lang]/technologies/page.tsx passing technologies data from content.technologies; chart rows are non-interactive (no click action) per FR-033/FR-034

**Checkpoint**: Technologies page shows flat chart with progress bars and years. Filter buttons filter by category. Sort toggle switches Time/A–Z. "Other" category last. Empty categories hidden. Progress bar colours match tier rules. Visual matches mockup.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final alignment and validation across all stories.

- [x] T049 [P] Verify all page h1 titles source from site-content.json (ui.nav.<page>[lang] for main pages, notFound.title[lang] for 404) — no hardcoded strings per FR-011b
- [x] T050 [P] Verify container alignment: header, nav, and main content share same max-width and horizontal padding per FR-004a
- [x] T051 [P] Verify mockup sidebar sections ("Core", contact-info, "Approach") are NOT rendered; single-column layout only per FR-004b
- [x] T052 Run full content pipeline: npm run content:check (build + validate against schema)
- [x] T053 Run npm run export and verify static output in out/ directory
- [x] T054 Manual walkthrough of quickstart.md scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Phase 2 — establishes page structure
- **Phase 4 (US2)**: Depends on Phase 3 (CV page shell from T018)
- **Phase 5 (US2b)**: Depends on Phase 4 (CV list sections from T026-T031)
- **Phase 6 (US3)**: Depends on Phase 3 (contact page shell T020)
- **Phase 7 (US4)**: Depends on Phase 2 T009 (tech years data) + Phase 3 T021 (tech page shell)
- **Phase 8 (Polish)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: After Phase 2 — no other story dependencies
- **US2 (P2)**: After US1 (needs CV page shell)
- **US2b (P2)**: After US2 (needs CV list sections)
- **US3 (P3)**: After Phase 3 T020 — independent of US2
- **US4 (P3)**: After Phase 2 T009 + Phase 3 T021 — independent of US2

### Parallel Opportunities

- **Phase 1**: T002, T003, T004 can run in parallel
- **Phase 2**: T006–T010 can run in parallel; T015, T016 can run in parallel
- **US1**: T019, T020, T021, T022 can run in parallel (different page files)
- **US2**: T027 can run in parallel with T026
- **US4**: T046, T047 can run in parallel (filter buttons vs sort toggle — independent state controls in same component)
- **US3 + US4**: Can run in parallel with each other (after Phase 3 T020/T021, in parallel with US2/US2b if team capacity allows)
- **Polish**: T049, T050, T051 can run in parallel

---

## Implementation Strategy

- **MVP**: Phase 1 + Phase 2 + Phase 3 (US1) = navigable 4-page bilingual site
- **Core value**: + Phase 4 + Phase 5 (US2/US2b) = CV content with search
- **Full feature**: + Phase 6 + Phase 7 (US3/US4) = contact form + tech chart page
- **Ship-ready**: + Phase 8 (Polish) = validated and aligned

---

## Phase 9: Externalize Hardcoded Strings (FR-038, SC-009)

**Purpose**: Move all remaining hardcoded user-facing strings to site-content.json via the UIStrings structure. Added 2026-04-28 per updated spec.

**Prerequisites**: Updated data-model.md (13 new UIStrings paths), updated contracts/site-content.schema.json (new LocalizedText fields under ui.meta, ui.notFound, ui.contact.validation, ui.contact.sending, ui.technologies).

### Phase 9a: Build Infrastructure

- [x] T055 Extend TypeScript interfaces with new UIStrings paths in lib/content/loadContent.ts — add `meta: { title: LocalizedText; description: LocalizedText }`, `notFound: { homeLink: LocalizedText }`, `technologies: { allCategory: LocalizedText; sortTime: LocalizedText; sortAlpha: LocalizedText; yearsLessThanOne: LocalizedText; yearsOne: LocalizedText; yearsSuffix: LocalizedText }` to `ui`, and add `sending: LocalizedText`, `validation: { required: LocalizedText; email: LocalizedText }` to `ui.contact`
- [x] T056 Add new UI string literals to the `ui` object builder in tools/build-content.ts — add all 13 new LocalizedText entries per data-model.md UIStrings table: ui.meta.title ("Malte Särner - CV"), ui.meta.description ("Malte Särners CV"), ui.notFound.homeLink ("Go to home page" / "Gå till startsidan"), ui.contact.sending ("Sending…" / "Skickar…"), ui.contact.validation.required ("This field is required" / "Detta fält är obligatoriskt"), ui.contact.validation.email ("Please enter a valid email address" / "Vänligen ange en giltig e-postadress"), ui.technologies.allCategory ("All" / "Alla"), ui.technologies.sortTime ("Time" / "Tid"), ui.technologies.sortAlpha ("A–Z" / "A–Ö"), ui.technologies.yearsLessThanOne ("< 1 yr" / "< 1 år"), ui.technologies.yearsOne ("1 yr" / "1 år"), ui.technologies.yearsSuffix ("yrs" / "år")

**Checkpoint**: Run `npm run content:check` — JSON regenerated with new fields and validates against updated schema. `npx tsc --noEmit` compiles.

### Phase 9b: Component Updates

- [x] T057 [P] Replace hardcoded metadata in app/layout.tsx — source title and description from `loadContent().ui.meta.title.en` and `loadContent().ui.meta.description.en` (root layout defaults to English)
- [x] T058 [P] Replace hardcoded metadata in app/[lang]/layout.tsx — source title and description from `loadContent().ui.meta.title[lang]` and `loadContent().ui.meta.description[lang]`
- [x] T059 [P] Replace hardcoded "Go to home page" in app/not-found.tsx — source from `loadContent().ui.notFound.homeLink.en` (defaults to English since no lang segment available)
- [x] T060 [P] Replace hardcoded validation messages and "Sending…" in components/ContactForm.tsx — source "This field is required" from `ui.contact.validation.required[lang]`, "Please enter a valid email address" from `ui.contact.validation.email[lang]`, and "Sending…" from `ui.contact.sending[lang]`
- [x] T061 [P] Replace hardcoded labels in components/TechChart.tsx — source "All" from `ui.technologies.allCategory[lang]`, "Time" from `ui.technologies.sortTime[lang]`, "A–Z" from `ui.technologies.sortAlpha[lang]`, and year format strings ("< 1 yr", "1 yr", "yrs") from `ui.technologies.yearsLessThanOne[lang]`, `ui.technologies.yearsOne[lang]`, `ui.technologies.yearsSuffix[lang]`

**Checkpoint**: All pages render correctly in both `/en/` and `/sv/`. No hardcoded user-facing strings remain.

### Phase 9c: Validation

- [x] T062 Run `npm run content:validate` to validate site-content.json against updated schema in specs/002-cv-website-pages/contracts/site-content.schema.json
- [x] T063 [P] Run grep scan of components/ and app/ directories for remaining hardcoded user-facing strings — confirm zero matches (SC-009)
- [x] T064 [P] Run `npx tsc --noEmit` to confirm TypeScript compiles with no errors

**Checkpoint**: FR-038 satisfied — all user-facing text sourced from site-content.json. SC-009 satisfied — zero hardcoded strings in component source.

### Phase 9 Dependencies

```text
Phase 9a:  T055 → T056
                    ↓
Phase 9b:  T057 | T058 | T059 | T060 | T061  (all parallel)
                    ↓
Phase 9c:  T062 | T063 | T064  (all parallel)
```

### Phase 9 Summary

- **Total new tasks**: 10 (T055–T064)
- **Phase 9a (Build Infrastructure)**: 2 tasks (sequential)
- **Phase 9b (Components)**: 5 tasks (all parallel)
- **Phase 9c (Validation)**: 3 tasks (all parallel)

## Constitution Check

| Gate                                  | Status                                          |
| ------------------------------------- | ----------------------------------------------- |
| 1. Output is static HTML/CSS/JS       | PASS — next.config.mjs: output: "export"        |
| 2. Custom tooling is TypeScript       | PASS — tools/\*.ts                              |
| 3. specs-input/cv/ is source of truth | PASS — build-content.ts reads from specs-input/ |

---

## Phase 10: Search Technologies, Description Paragraphs, About HTML (R11)

**Purpose**: Three incremental improvements: (1) include per-entry technologies in CVEntry JSON so search matches technology names, (2) render CV description lines as separate paragraphs, (3) render about page text with HTML support for embedded links. Added 2026-04-28 per updated spec (US2b, FR-024, FR-025).

**Prerequisites**: Updated data-model.md (technologies field on CVEntry), updated contracts/site-content.schema.json (technologies array on CVEntry), research.md R11.

### Phase 10a: Build Infrastructure

- [x] T065 Add `technologies: string[]` to CVEntry interface in lib/content/loadContent.ts
- [x] T066 [P] Add `technologies: string[]` to CVEntry interface in tools/build-content.ts and populate it from `entry.meta.technologies` (split on comma, trim, filter empty; default to empty array `[]` when field is absent) when building cvEntries

**Checkpoint**: Run `npm run content:build` — site-content.json now includes `technologies` array on every CVEntry. Run `npm run content:validate` — validates against updated schema. `npx tsc --noEmit` compiles.

### Phase 10b: Component Updates

- [x] T067 [P] [US2b] Include technologies in search haystack in components/CvSections.tsx — add `(item.technologies ?? []).join(" ")` to the `hay` array in `matchesQuery()` so searching "React" or "TypeScript" matches assignments that used those technologies
- [x] T068 [P] [US2] Render CV description as paragraphs in components/CvSections.tsx — in the expanded item view, split `item.description[lang]` on `\n`, filter out empty lines, and render each non-empty line as a separate `<p>` element with `space-y-3` spacing per FR-024
- [x] T069 [P] Render about text with HTML support in app/[lang]/about/page.tsx — replace `{aboutText}` with `dangerouslySetInnerHTML={{ __html: aboutText }}` on the paragraph element so embedded `<a>` tags render as clickable links per FR-025/R11c

**Checkpoint**: On CV page, searching "React" shows assignments that list React in their technologies. Expanding a CV entry shows description with proper paragraph breaks. On About page, the GitHub link renders as a clickable anchor.

### Phase 10c: Validation

- [x] T070 Run `npm run content:check` to validate site-content.json with technologies field against updated schema
- [x] T071 [P] Run `npx tsc --noEmit` to confirm TypeScript compiles with no errors

**Checkpoint**: Build + schema validation pass. TypeScript compiles cleanly.

### Phase 10 Dependencies

```text
Phase 10a:  T065 ─┐
            T066 ─┤ (parallel, different files)
                  ↓
Phase 10b:  T067 | T068 | T069  (all parallel, different files/functions)
                  ↓
Phase 10c:  T070 | T071  (all parallel)
```

### Phase 10 Summary

- **Total new tasks**: 7 (T065–T071)
- **Phase 10a (Build Infrastructure)**: 2 tasks (parallel — different files)
- **Phase 10b (Components)**: 3 tasks (all parallel — different files/functions)
- **Phase 10c (Validation)**: 2 tasks (parallel)

---

## Phase 11: Responsive Mobile Layout (User Story 5 / FR-040–FR-052)

**Goal**: Site adapts to narrow screens (≤720 px) with hamburger menu, truncated summary, stacked cards, mobile tech filters, and sr-only H1 titles.

**Independent Test**: Resize to ≤720 px; verify hamburger opens drawer with lang toggle + nav links; verify sr-only H1s in DOM; verify summary truncation; verify stacked card periods; verify tech page mobile filter nav; verify full-width contact submit.

### Phase 11a: Preparation & Reusable Components

- [x] T072 [US5] Add `ui.cv.showMoreSummary` i18n key to build tool (`tools/build-content.ts`): `{ en: "Show all", sv: "Visa mer" }`. Add to contracts schema. Rebuild and validate content per FR-046/FR-038
- [x] T073 [P] [US5] Add `sr-only` utility class to `app/globals.css` implementing screen-reader-only pattern (`position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0`) per FR-041
- [x] T074 [P] [US5] Extract a reusable `HamburgerDrawer` client component (`components/HamburgerDrawer.tsx`) that encapsulates: hamburger button (three-span icon with open/close X animation), active label, and slide-down drawer container. Props: `isOpen`, `onToggle`, `activeLabel`, `children` (drawer content). The same component MUST be used for main nav and tech filter nav per FR-044. Styling per mockup: hamburger 44×44 px; drawer uses absolute positioning, max-height transition 0→70vh, box-shadow per FR-052

### Phase 11b: Main Navigation — Mobile

- [x] T075 [US5] Refactor `components/Menu.tsx` to be responsive: on mobile (≤720 px), hide desktop `.nav-links` and `.lang-toggle`; show `HamburgerDrawer` with active page label. Nav bar height: 56 px on mobile, 72 px on desktop. Horizontal padding: 1rem on mobile, 2rem on desktop per FR-042/FR-043/FR-045
- [x] T076 [US5] Implement nav drawer content inside `Menu.tsx`: language toggle (EN/SV with min-height 44 px) at top, then four nav links (CV/Technologies/About/Contact) with active-page styling, touch-friendly sizing (min-height 44 px, font-size 0.9rem, padding 0.65rem 0.75rem). Tapping a link closes the drawer per FR-043

### Phase 11c: H1 Titles — sr-only

- [x] T077 [US5] Update all page `h1` elements across `app/[lang]/page.tsx`, `app/[lang]/about/page.tsx`, `app/[lang]/contact/page.tsx`, `app/[lang]/technologies/page.tsx`, and `app/not-found.tsx` to use the `sr-only` class so they are visually hidden but remain in the DOM for SEO per FR-041. Also update `components/CvPageClient.tsx` h1.

### Phase 11d: CV Page — Summary Truncation & Stacked Cards

- [x] T078 [US5] Implement mobile summary truncation in `components/CvPageClient.tsx`: on mobile, apply CSS line clamping (`-webkit-line-clamp: 3`) to the summary paragraph. Show a "Show all" button below (label from `ui.cv.showMoreSummary[lang]`). Tapping expands fully (one-way, removes truncation class, hides button). On desktop, summary always fully visible per FR-046
- [x] T079 [P] [US5] Add responsive CSS to `components/CvSections.tsx` for mobile card layout: role cards use `flex-wrap: wrap` on main row with period having `flex-basis: 100%; order: -1` (period above title). Same for assignment rows per FR-047

### Phase 11e: Mobile Spacing & Contact

- [x] T080 [P] [US5] Add responsive mobile styles in `components/CvPageClient.tsx` and `app/globals.css` for CV content area and search: top area padding `1.75rem 1rem 2rem`, summary font-size `0.9rem`, search bar `max-width: 100%` with input `font-size: 16px` (prevents iOS zoom), content area horizontal padding `1rem`, section margin `2.5rem` per FR-049
- [x] T081 [P] [US5] Add mobile responsive styles to `components/ContactForm.tsx`: submit button `width: 100%`, centered text, padding `0.8rem`; input fields `font-size: 16px` to prevent iOS auto-zoom per FR-051

### Phase 11f: Technologies Page — Mobile Filter Nav

- [x] T082 [US5] Refactor `components/TechChart.tsx` to use `HamburgerDrawer` for mobile: hide desktop filter bar (category buttons + sort toggle) at ≤720 px. Show a mobile filter nav bar with `HamburgerDrawer` containing: sort toggle (Time/A–Z) at top, then category filter buttons (All + categories) with touch-friendly sizing. Active category label shown next to hamburger. Tapping a filter/sort closes drawer and updates chart per FR-048
- [x] T083 [P] [US5] Add mobile tech chart CSS: narrower name column (`width: 110px; font-size: 0.78rem`), smaller years column (`width: 30px; font-size: 0.68rem`) per FR-050

### Phase 11g: Validation

- [x] T084 [US5] Run full content pipeline (`npm run content:check`) to verify new i18n key
- [x] T085 [US5] Run `npm run export` and verify static output
- [ ] T086 [US5] Manual walkthrough at ≤720 px and >720 px — verify all acceptance scenarios from User Story 5

**Checkpoint**: At ≤720 px: hamburger menu works with lang toggle + nav links; H1s are sr-only; CV summary truncated with expand; cards stacked; tech page uses mobile filter nav; contact submit full-width; search input no-zoom. At >720 px: desktop layout unchanged.

### Phase 11 Dependencies

```text
Phase 11a:  T072 ─┐
            T073 ─┤ (all three parallel — independent outputs)
            T074 ─┘
                  ↓
Phase 11b:  T075 → T076  (sequential, both need T074)
Phase 11c:  T077  (needs T073)
Phase 11d:  T078 (needs T072) | T079  (parallel)
Phase 11e:  T080 | T081  (parallel, independent CSS)
Phase 11f:  T082 (needs T074) | T083  (parallel)
                  ↓
Phase 11g:  T084 | T085 | T086  (all parallel, after above)
```

### Phase 11 Summary

- **Total new tasks**: 15 (T072–T086)
- **Phase 11a (Preparation)**: 3 tasks (all parallel — independent outputs)
- **Phase 11b (Main Nav Mobile)**: 2 tasks (sequential)
- **Phase 11c (H1 sr-only)**: 1 task
- **Phase 11d (CV Page Mobile)**: 2 tasks (parallel)
- **Phase 11e (Mobile Spacing)**: 2 tasks (parallel)
- **Phase 11f (Tech Page Mobile)**: 2 tasks (parallel)
- **Phase 11g (Validation)**: 3 tasks (parallel)
