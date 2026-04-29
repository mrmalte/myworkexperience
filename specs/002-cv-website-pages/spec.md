# Feature Specification: Static CV Website Pages

**Feature Branch**: `002-cv-website-pages`  
**Created**: 2026-01-10  
**Status**: Draft  
**Input**: Build a simple, clean, modern static website with pages (CV, Contact, About), language routing (`/en/`, `/sv/`), and CV content sourced from `specs-input/cv/`.

## Clarifications

### Session 2026-03-09

- Q: CV page layout — where does the Summary appear and how does it relate to the mockup hero section? → A: Follow the mockup layout: Summary goes in the full-width hero section (below the search bar); Education, Roles, and Assignments appear as list sections inside the content area below the hero.
- Q: Should the hero stats block (years / roles / hybrid) be included, and if so how are values derived? → A: Include the stats block; derive all three values from CV data: years = current year − year of the earliest CV entry; roles = count of role-type entries (employee/voluntary/national); hybrid = count of assignment entries with `locationType === "hybrid"`.
- Q: The mockup has a two-column content area with a sidebar; with sidebar content excluded, should the two-column layout be kept? → A: No — use a single-column content area; the sidebar grid column is dropped entirely.
- Q: Should the "Open to work" animated badge from the mockup nav be included? → A: No — omit it entirely.
- Q: Where should the Role value be rendered — nav bar or hero eyebrow? → A: In the nav alongside the name, as specified in FR-002 (hero eyebrow is separate and may also show it, but nav is the canonical location).
- Mockup update 2026-03-09: The mockup was revised — the sticky nav now contains a combined name+role block (`nav-name-block`: role as small eyebrow above the name); the `h1` and `.hero-eyebrow` elements were removed from the hero section. FR-002, FR-003, and FR-012 updated accordingly.
- Mockup update 2026-03-09: Hero stats layout changed from a right-side column to a horizontal row below the summary text. FR-012 and FR-012a updated accordingly.

### Session 2026-04-29

- Mockup update 2026-04-29: `specs-input/mockup/scandinavian.html` updated with responsive mobile layout. Breakpoint at 720 px. Desktop layout remains largely unchanged. Mobile layout adds: hamburger menu, summary truncation, stacked card fields, and mobile-specific technology filter navigation. FR-040 through FR-052 added. Existing FR numbers unchanged.

## User Scenarios & Testing _(mandatory)_

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Navigate site pages + language (Priority: P1)

As a site visitor, I want to navigate between CV, Technologies, About, and Contact pages and switch between English and Swedish so that I can view the content in my preferred language.

**Why this priority**: Basic navigation and language routing are required for any usable site experience.

**Independent Test**: Open the site at `/` and verify it redirects to the default language CV page; navigate to each page via menu (CV, Technologies, About, Contact); switch language and verify URL updates and content language updates.

**Acceptance Scenarios**:

1. **Given** a visitor opens `/`, **When** the site loads, **Then** the visitor is redirected to `/en/` and sees the CV page.
2. **Given** a visitor is on `/en/about`, **When** they choose Swedish, **Then** they are navigated to `/sv/about` and see Swedish content.
3. **Given** a visitor is on `/sv/contact`, **When** they refresh the page, **Then** `/sv/contact` remains selected and Swedish remains active.
4. **Given** a visitor is on any page, **When** they click the Technologies nav link, **Then** they are navigated to `/[lang]/technologies` and see the technology category page.

---

### User Story 2 - Read CV summary + categorized experience lists (Priority: P2)

As a site visitor, I want to see my CV summary and browse Education, Roles, and Assignments lists (newest first) so that I can quickly understand the background and drill into details.

**Why this priority**: This is the primary value of the site.

**Independent Test**: On the CV page, verify summary is shown, each section is present, lists are newest-first, show-5 behavior works, and clicking an item expands/collapses its description.

**Acceptance Scenarios**:

1. **Given** CV data exists under `specs-input/cv/`, **When** the visitor opens the CV page, **Then** the hero section shows the Summary text, and Education/Roles/Assignments list sections render below the hero in that order.
2. **Given** a section has more than 5 items, **When** the visitor first loads the page, **Then** only 5 are visible and a “Show all” control is available.
3. **Given** an item is visible in a list, **When** the visitor clicks it, **Then** the item expands to show its full description text in the active language.

---

### User Story 2b - Search experience lists (Priority: P2)

As a site visitor, I want to search for key words in Education, Roles, and Assignments lists (newest first) so that I can quickly find matching experience.

**Why this priority**: Search enhances CV browsing by letting visitors quickly locate relevant experience.

**Independent Test**: On the CV page, type a keyword in the search bar and verify only matching entries are shown across all sections; type multiple words and verify AND-match behavior; clear the field and verify all entries are restored; type a term with no matches and verify a per-section "no results" indicator appears.

**Acceptance Scenarios**:

1. **Given** CV page is shown, **When** search field is empty, **Then** complete CV page is shown according to user story 2.
2. **Given** CV page is shown, **When** search field contains one or more space-separated words, **Then** only entries whose searchable text (period, title/role, organization, client, location, description in the active language, and technologies list) contains all words (case-insensitive AND match) are shown in each section; sections with no matches show a "no results" indicator.
3. **Given** a search is active, **When** the visitor clears the search field, **Then** all entries are restored across all sections.

---

### User Story 3 - Send a contact message (Priority: P3)

As a site visitor, I want to submit a contact form that sends an email so that I can reach out directly.

**Why this priority**: Enables contact without exposing personal email handling details on the page.

**Independent Test**: Open the Contact page, submit with missing fields and confirm validation errors; submit with valid fields and confirm the send action is performed and success state is shown.

**Acceptance Scenarios**:

1. **Given** the visitor is on the Contact page, **When** they submit with any empty field, **Then** submission is blocked and field-level error messaging is shown.
2. **Given** all fields are filled with valid values, **When** the visitor submits, **Then** an email send is attempted and the visitor sees a success confirmation.

---

### User Story 4 - Browse technologies by category (Priority: P3)

As a site visitor, I want to see all technologies I have worked with, visualized as a chart with experience duration, so that I can quickly assess the technical breadth and depth.

**Why this priority**: Useful supplementary context for recruiters; does not block core CV browsing.

**Independent Test**: Open `/en/technologies` and verify a chart of technology rows is shown with progress bars and years; use filter buttons to show only one category; toggle sort between Time and A–Z; navigate to `/technologies` and confirm redirect to `/en/technologies`.

**Acceptance Scenarios**:

1. **Given** a visitor opens `/en/technologies`, **When** the page loads, **Then** they see category filter buttons ("All" + one per non-empty category) and a flat chart of technology rows, each showing the technology name, a progress bar scaled by years of experience, and a years label.
2. **Given** a visitor clicks a category filter button, **When** the chart updates, **Then** only technologies belonging to that category are shown.
3. **Given** a visitor clicks the "All" filter button, **When** the chart updates, **Then** all technologies across all categories are shown.
4. **Given** a visitor toggles the sort control to "A–Z", **When** the chart updates, **Then** technologies are sorted alphabetically. Toggling to "Time" sorts by years descending (default).
5. **Given** a technology appears in a CV entry but is not in `tech-categories.json`, **When** the page loads, **Then** that technology appears under the "Other" category.
6. **Given** a visitor opens `/technologies` (no language prefix), **When** the page loads, **Then** they are redirected to `/en/technologies`.

### Edge Cases

- Visitor opens a URL without a language prefix (e.g., `/about`).
- Visitor opens an unknown route (e.g., `/en/does-not-exist`).
- Technologies page: a technology in a `Technologies:` field that is not found in any category in `tech-categories.json` MUST appear in the "Other" category.
- CV sections contain fewer than 5 items (no “Show all” control).
- Exactly 5 items exist (no “Show all” control).
- CV content parsing fails or a required CV file is missing (site must fail gracefully with an actionable error state — see FR-039).
- Contact form submission fails (network error or provider error).

---

### User Story 5 - Responsive mobile layout (Priority: P2)

As a site visitor on a mobile device, I want the site to adapt to narrow screens with a hamburger menu, truncated CV summary, and compact card layouts so that I can comfortably browse the site on my phone.

**Why this priority**: Mobile traffic is a significant share of visitors; a non-responsive layout would make the site unusable on phones.

**Independent Test**: Open the site at ≤720 px viewport width; verify hamburger menu appears and opens a drawer with language toggle, navigation links; verify H1 titles are visually hidden but present in DOM; verify CV summary is truncated to ~3 lines with "Show all" button; verify role cards and assignment rows stack period above title; verify technology page uses a hamburger menu for category filters and sort toggle; verify contact form submit button is full-width.

**Acceptance Scenarios**:

1. **Given** a viewport ≤720 px, **When** the site loads, **Then** the desktop nav links and language toggle are hidden and a hamburger icon appears on the right side of the nav bar, with the current page label shown next to it.
2. **Given** the hamburger menu is visible, **When** the visitor taps it, **Then** a drawer slides open containing: the language toggle at the top, followed by the four navigation links (CV, Technologies, About, Contact) with active-page styling.
3. **Given** the drawer is open, **When** the visitor taps a navigation link, **Then** the drawer closes and the visitor navigates to the selected page.
4. **Given** a viewport ≤720 px on the CV page, **When** the page loads, **Then** the summary text is truncated to ~3 lines with a "Show all" button visible below it. Tapping "Show all" expands the full summary and hides the button.
5. **Given** a viewport ≤720 px, **When** viewing role cards or assignment rows, **Then** the period is displayed above the title (stacked layout) instead of inline to the right.
6. **Given** a viewport ≤720 px on the Technologies page, **When** the page loads, **Then** the desktop filter bar is hidden and a mobile hamburger navigation bar appears containing the active category label and a hamburger icon. Tapping the hamburger opens a drawer with the sort toggle and category filter buttons.
7. **Given** any page at ≤720 px, **When** the page renders, **Then** `h1` page titles are visually hidden (sr-only) but remain in the DOM for SEO and screen readers.

## Requirements _(mandatory)_

**Constitution alignment (mandatory)**

- The delivered product MUST be deployable as static assets: plain HTML, CSS, and JavaScript.
- Custom build tooling MUST be implemented in TypeScript.
- CV source material under `specs-input/cv/` is the source of truth; generated output MUST NOT be edited by hand.

### Functional Requirements

#### Site Pages & Layout

- **FR-001**: The site MUST have exactly four pages: **CV**, **Technologies**, **About**, and **Contact**.
- **FR-002**: The site MUST render a sticky nav bar at the top of every page that serves as both the site header and navigation. The left side of the nav MUST display a name block (`nav-name-block`) containing:
  - The Role value from `specs-input/cv/summary/meta.txt` as a small uppercase eyebrow label above the name, rendered in `var(--accent)` color (the green design token).
  - The name "Malte Särner" below it, rendered in Fraunces serif font at ~1.35rem, weight 600, letter-spacing -0.02em.
    _FR-002a: reserved (visual details now covered by the mockup via FR-004b)._
- **FR-003**: The same sticky nav bar MUST contain page links (`CV`, `Technologies`, `About`, `Contact`) in that order, and a language selector on the right side. Each link label MUST be sourced from `site-content.json` → `ui.nav.<page>[lang]`.

_FR-003b: reserved (visual details now covered by the mockup via FR-004b)._

- **FR-003a**: The "Open to work" badge visible in the mockup nav MUST NOT be included.
- **FR-004**: The menu MUST visually indicate which page is currently selected.
- **FR-004a**: Header, menu, and main page content MUST share the same centered content container (consistent horizontal padding and max width) so their left edges stay aligned at all viewport sizes.
- **FR-004b**: The mockup `specs-input/mockup/scandinavian.html` MUST be used as the visual and structural base for the layout. The color scheme, typography (Fraunces + Instrument Sans), spacing, card patterns, and search bar MUST be adopted from the mockup. The sidebar "Core", contact-info, and "Approach" sections in the mockup MUST be ignored; the content area below the hero MUST use a single-column layout (the two-column grid from the mockup is dropped). Where the mockup conflicts with an explicit requirement in this spec, the explicit requirement takes precedence.

#### Routing & Language

- **FR-005**: The site MUST support exactly two languages: English (`en`) and Swedish (`sv`).
- **FR-006**: English (`en`) MUST be the default language.
- **FR-007**: The selected language MUST be encoded in the URL path as the first segment: `/en/…` or `/sv/…`.
- **FR-008**: If a visitor opens a route without a language prefix, the site MUST redirect to the same route under the default language.
  - Example: `/about` redirects to `/en/about`.
- **FR-009**: When the visitor switches language, the site MUST navigate to the same page under the selected language.
- **FR-010**: The language selector MUST be a segmented toggle group with both language options (`EN` and `SV` as uppercase text labels) always visible side by side. Clicking the inactive option navigates to the same page under the selected language.
  _FR-010a: reserved (visual details now covered by the mockup via FR-004b)._

#### Default Page

- **FR-011**: When a visitor loads the site at `/` (or the language root like `/en/`), the CV page MUST be shown.

#### Page Titles

- **FR-011b**: Every page MUST render an `h1` page title at the top of its content area. The `h1` MUST be visually hidden via `sr-only` styling (see FR-041) but remain in the DOM for SEO and accessibility. Title text per page:

  | Page         | English          | Swedish               |
  | ------------ | ---------------- | --------------------- |
  | CV           | "CV"             | "CV"                  |
  | Technologies | "Technologies"   | "Teknologier"         |
  | About        | "About"          | "Om"                  |
  | Contact      | "Contact"        | "Kontakt"             |
  | Not-found    | "Page not found" | "Sidan hittades inte" |

  For the four main pages (`cv`, `technologies`, `about`, `contact`), the title text MUST be sourced from `site-content.json` → `ui.nav.<page>[lang]`. For the not-found page, the title text MUST be sourced from `site-content.json` → `notFound.title[lang]`.

#### Search Bar

- **FR-011a**: The CV page MUST display a search bar **above the list sections** (Education/Roles/Assignments), immediately below the Summary text block. The search bar filters list content as the visitor types. Visual styling MUST match the mockup (FR-004b). The placeholder text MUST be sourced from `site-content.json` → `ui.cv.searchPlaceholder[lang]` ("Search…" / "Sök…"). The clear button aria-label MUST be sourced from `ui.cv.clearSearch[lang]` ("Clear search" / "Rensa sökning").

#### CV Page Content Structure

- **FR-012**: The CV page MUST be structured as follows, top to bottom:
  1. `h1` page title: "CV" (FR-011b).
  2. **Summary block**: the Summary text (FR-013). No hero wrapper or stats strip.
  3. **Search bar** (FR-011a): directly below the Summary block, above the list sections.
  4. **List sections** in this order: Education → Roles → Assignments.
     The name and role are shown in the nav bar (FR-002) only and MUST NOT appear in the page content area.

_FR-012a: reserved (removed — stats strip design)._

_FR-012b: reserved (removed — stats strip design)._

_FR-012c: reserved (removed — stats strip design)._

- **FR-013**: Summary text MUST come from the description body of `specs-input/cv/summary/<lang>.txt` (active language). It is rendered as a plain text block — there is no hero section wrapping it.
- **FR-014**: Education list items MUST be sourced from CV entries where `Type` is `education`.
- **FR-015**: Roles list items MUST be sourced from CV entries where `Type` is one of: `employee`, `consultant`, `voluntary`, `national`.
- **FR-016**: Assignments list items MUST be sourced from CV entries where `Type` is `assignment`.
- **FR-017**: All CV lists MUST be sorted newest-first using the entry sort key defined by the CV data format.

#### CV List Rendering

- **FR-018**: Each list item MUST display the `ItemLabel` on the left and the `Period` on the right within the same row.
- **FR-018a**: If `Period` has no end-date, the UI MUST render the end-date as `present` in English (`en`) and `Nuvarande` in Swedish (`sv`). This label MUST be sourced from `site-content.json` → `ui.cv.present[lang]`.
- **FR-018b**: Each CV list item visual MUST match the mockup (FR-004b). Section heading labels MUST be sourced from `site-content.json` → `ui.cv.sections.<key>[lang]` (keys: `education`, `roles`, `assignments`).
- **FR-018c**: The "Show all" control label text MUST be sourced from `site-content.json` → `ui.cv.showAll[lang]` ("Show all" / "Visa alla"). Visual styling MUST match the mockup (FR-004b).
- **FR-018d**: For `education` entries, the period column MUST display only the **graduation year** rather than the full period range. The graduation year is derived as follows: if `period.end` is non-null, take its first 4 characters (`YYYY`); if `period.end` is null (open-ended), fall back to the first 4 characters of `period.start`. The `present` / `Nuvarande` fallback defined in FR-018a MUST NOT be used for education entries.
- **FR-019**: For Education and Assignments, `ItemLabel` MUST be the `Title:` value from the active language file.
- **FR-020**: For Roles, `ItemLabel` MUST be the `Role` value from the entry metadata.
- **FR-021**: If a CV list has more than 5 items, the page MUST show only the newest 5 by default.
- **FR-022**: If a CV list has more than 5 items, a “Show all” control MUST be available to reveal all items.
- **FR-023**: If a CV list has 5 items or fewer, no “Show all” control MUST be shown.
- **FR-024**: When a visitor clicks a CV list item, it MUST expand to reveal the full description body from the active language file. Each non-empty line in the description MUST be rendered as a separate paragraph; empty lines MUST be omitted.
- **FR-024a**: The "no results" indicator shown when a search yields no matches in a CV list section MUST be sourced from `site-content.json` → `ui.cv.noResults[lang]` ("No results" / "Inga resultat").

#### Technologies Page

- **FR-033**: The Technologies page MUST be accessible at `/[lang]/technologies`. The redirect from `/technologies` to `/en/technologies` is handled by FR-008 (all non-prefixed routes redirect to the default language equivalent).
- **FR-034**: The Technologies page MUST render a flat chart of technology rows matching the mockup (FR-004b). Each row MUST display: a fixed-width technology name on the left, a horizontal progress bar in the centre (6 px height, width scaled proportionally where the technology with the most years fills 100%), and a right-aligned years label (e.g. "8 yrs"). The chart is a single flat list — no category section headings. Category filter buttons and a sort toggle (see FR-034a, FR-034b) appear above the chart.
- **FR-034a**: Above the chart, category filter buttons MUST be rendered: an "All" button followed by one button per non-empty category (in `tech-categories.json` key order, which is authoritative; "Other" last if present). Clicking a category button filters the chart to show only that category's technologies; clicking "All" shows all. The active button MUST use accent styling per the mockup (FR-004b). Only categories containing at least one used technology MUST have a filter button.
- **FR-034b**: A sort toggle MUST be rendered right-aligned within the filter row, as a segmented control with two options: "Time" (years descending — default) and "A–Z" (alphabetical ascending). The active option MUST use dark background / white text per the mockup (FR-004b).
- **FR-035**: The progress bar colour MUST follow a four-tier gradient based on absolute years: ≥ 12 years `#1a6b4a`, ≥ 7 years `#2d9b6f`, ≥ 3 years `#6bbea0`, < 3 years `#a8d8c8`. The progress bar width MUST be `years / maxYears × 100 %` where `maxYears` is the maximum years value across all technologies (no hardcoded constant). Chart rows are non-interactive (no click action).
- **FR-036**: A category MUST only receive a filter button (FR-034a) and have its technologies included in the chart if at least one technology in that category appears in any CV entry's `Technologies:` field. Empty categories MUST NOT appear in the filter buttons or the chart.
- **FR-037**: The Technologies page content MUST be derived at build time from `specs-input/tech-categories.json` intersected with the `Technologies:` fields across all CV entries — only technologies used in at least one entry are shown. For each technology, the build tool MUST compute total years of experience by summing the raw months of every CV entry whose `Technologies:` field includes that technology (duration per entry = months between period start and period end; ongoing entries use the current build date as end), then dividing the total months by 12 and rounding to the nearest integer. Technologies whose computed years round to zero MUST still be included and displayed as "< 1 yr". Any technology present in a CV entry but absent from `tech-categories.json` MUST be placed in the "Other" category. The "Other" category MUST always be rendered last. Its label is "Other" in both English and Swedish.

#### About Page

- **FR-025**: The About page MUST render the about text from `specs-input/about/<lang>.txt`. HTML markup in the source text (e.g., `<a>` tags) MUST be rendered as HTML, not escaped as plain text.

#### Not-Found Page

- **FR-031**: The not-found (404) page MUST render its description text from `specs-input/not-found/<lang>.txt`, following the same content pipeline as the About page (`parseSource` → `site-content.json` under `notFound.text` → `loadContent()`). Because the not-found page has no language URL segment, it MUST default to the site default language (`en`). This is intentional — no language context is available without a URL prefix. The page MUST render an `h1` title per FR-011b, sourced from `site-content.json` → `notFound.title[lang]`, and the description text below it.

_FR-032: reserved._

#### Error Handling

- **FR-039**: If the content build tool (`tools/build-content.ts`) encounters a missing or malformed CV source file under `specs-input/cv/`, it MUST fail the build with an actionable error message identifying the problematic file and the nature of the error (e.g., missing required field, unparseable period). The site MUST NOT deploy with incomplete or corrupt CV data.

#### Localization

- **FR-038**: All user-facing text strings — including page metadata, button labels, validation messages, sort/filter labels, and unit labels — MUST be sourced from `site-content.json` via the `ui` UIStrings structure. No translatable strings may be hardcoded in component source files.

#### Contact Page

- **FR-026**: The Contact page MUST include a form with fields: `Name`, `Email`, `Subject`, `Message`.
- **FR-027**: All contact form fields MUST be required and validated on submit.
- **FR-028**: On successful validation, the form MUST send an email using EmailJS. The three required configuration values MUST be read from environment variables at runtime:
  - `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY`
  - `NEXT_PUBLIC_EMAILJS_SERVICE_ID`
  - `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID`
    Real values MUST be stored only in `.env.local` (gitignored) and MUST NOT appear in this spec or in committed files. If any variable is missing at runtime, the form MUST fail with the error state (FR-030) rather than throwing an unhandled error.
- **FR-029**: After a successful send, the user MUST see a confirmation state.
- **FR-030**: If sending fails, the user MUST see a failure state with guidance to retry.

#### Responsive Layout & Mobile Navigation

- **FR-040**: The site MUST be responsive. The mobile breakpoint is ≤ 720 px viewport width. The mockup `specs-input/mockup/scandinavian.html` is the canonical reference for all responsive behavior (FR-004b applies). Desktop layout (> 720 px) remains unchanged from the existing implementation.
- **FR-041**: On mobile (≤ 720 px), all page `h1` titles MUST be visually hidden using an `sr-only` / screen-reader-only CSS pattern (e.g., `position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0)`) so they remain in the DOM for SEO and accessibility, but do not consume visual space. On desktop they remain visually hidden as well (the mockup removed visible H1s in both layouts).
- **FR-042**: On mobile (≤ 720 px), the nav bar MUST hide the desktop nav links and language toggle, and instead show:
  - A **hamburger button** on the right side of the nav bar (three horizontal lines; animates to an X when the drawer is open).
  - An **active page label** to the left of the hamburger (pushed to the right with `margin-left: auto`), displaying the current page name in accent colour.
  - The name-block on the left remains visible.
- **FR-043**: On mobile, tapping the hamburger MUST open a **nav drawer** that slides down from the nav bar (using `max-height` transition). The drawer MUST contain, top to bottom:
  1. The language toggle (same EN/SV segmented control as desktop, with larger touch targets: `min-height: 44px`).
  2. The four navigation links (CV, Technologies, About, Contact) with the active page highlighted. Each link MUST have touch-friendly sizing (`min-height: 44px`, `font-size: 0.9rem`, `padding: 0.65rem 0.75rem`).
     Tapping a link MUST close the drawer and navigate to that page.
- **FR-044**: The hamburger menu component MUST be reusable. The same drawer structure (hamburger button + active label + slide-down drawer) MUST be used for both the main site navigation and the technology page filter navigation on mobile. The component accepts different content (nav links vs. filter buttons) via composition.
- **FR-045**: On mobile, the nav bar height MUST be `56px` (reduced from `72px` on desktop), with horizontal padding `1rem` (reduced from `2rem`).
- **FR-046**: On mobile on the CV page, the summary text MUST be truncated using CSS line clamping (`-webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; display: -webkit-box`). A "Show all" / "Visa mer" button MUST appear below the truncated summary. Tapping the button removes the truncation class and hides the button (one-way expand — no re-collapse). The button label MUST be sourced from `site-content.json` → `ui.cv.showMoreSummary[lang]` ("Show all" / "Visa mer"). On desktop, the summary is always fully visible (no truncation, no button).
- **FR-047**: On mobile, CV role cards MUST stack the period above the title: `.role-card-main` uses `flex-wrap: wrap`, the period element has `flex-basis: 100%; order: -1` so it appears first. Same for assignment rows: the period wraps above the assignment name.
- **FR-048**: On mobile on the Technologies page, the desktop filter bar (category buttons + sort toggle) MUST be hidden. In its place, a **mobile filter navigation bar** MUST appear, using the same reusable hamburger menu component (FR-044). This bar MUST display:
  - The active category label (or "All") on the left, pushed right (`margin-left: auto`).
  - A hamburger button on the right.
    Opening the drawer MUST show, top to bottom:
  1. The sort toggle (Time / A–Z segmented control).
  2. The category filter buttons (All + one per non-empty category), each with touch-friendly sizing.
     Tapping a filter or sort option MUST close the drawer and update the chart.
- **FR-049**: On mobile, the CV content area padding MUST be reduced (`1.75rem 1rem 2rem`) and font sizes reduced (summary: `0.9rem`). The search bar MUST be full-width (`max-width: 100%`) with `font-size: 16px` on the input (prevents iOS zoom-on-focus). Content area horizontal padding MUST be `1rem`.
- **FR-050**: On mobile, tech chart name column MUST be narrower (`width: 110px; font-size: 0.78rem`) and years column smaller (`width: 30px; font-size: 0.68rem`).
- **FR-051**: On mobile, the contact form submit button MUST be full-width (`width: 100%`) with centered text and increased padding (`0.8rem`). Input fields MUST use `font-size: 16px` to prevent iOS auto-zoom.
- **FR-052**: The nav drawer MUST overlay page content (not push it down). It uses `position: absolute; left: 0; right: 0; top: 100%` relative to the nav, with `box-shadow: 0 8px 24px rgba(0,0,0,0.08)` and `z-index: 99`. The `max-height` transitions from `0` to `70vh` with `overflow-y: auto` when open.

### Key Entities _(include if feature involves data)_

- **Language**: `en` or `sv`.
- **Page**: One of `cv`, `technologies`, `contact`, `about`.
- **CVEntry**: A single parsed CV item from `specs-input/cv/` (metadata + language content).
- **CVSection**: One of `summary`, `education`, `roles`, `assignments`.
- **ContactMessage**: Submitted contact form content: `name`, `email`, `subject`, `message`.
- **TechCategory**: A named group of technologies defined in `specs-input/tech-categories.json`. Each technology carries a computed `years` value derived from CV entry durations.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Visitors can reach each page (CV/Technologies/Contact/About) in both languages via URL (`/en/...`, `/sv/...`) with correct active-menu indication.
- **SC-007**: On the Technologies page, all technologies used in at least one CV entry are visible in a chart showing technology name, progress bar, and years of experience. Category filter buttons allow filtering by category, and a sort toggle switches between time-descending and alphabetical order.
- **SC-002**: Opening a route without language prefix redirects to the default-language equivalent 100% of the time.
- **SC-003**: On the CV page, lists are newest-first and show only 5 items by default when more exist, with “Show all” available.
- **SC-004**: Clicking a CV item reveals its full description in the active language.
- **SC-005**: Contact form blocks submission when any required field is missing, and attempts EmailJS send when all fields are valid.
- **SC-006**: On the CV page, typing a keyword in the search bar filters list items to those containing that keyword; typing multiple words filters to items matching all words (case-insensitive AND); clearing the field restores all entries; sections with no matches display a "no results" indicator.
- **SC-008**: Opening an unknown route renders the not-found page with description text sourced from `specs-input/not-found/en.txt`.
- **SC-009**: Zero user-facing strings are hardcoded in component source files; all translatable text is sourced from `site-content.json`.
- **SC-010**: At ≤720 px viewport width, the desktop nav links and language toggle are hidden; a hamburger menu opens a drawer with language toggle and nav links; tapping a link navigates and closes the drawer.
- **SC-011**: At ≤720 px on the CV page, the summary is truncated to ~3 lines with a "Show all" button; tapping expands it fully.
- **SC-012**: At ≤720 px on the Technologies page, the desktop filter bar is replaced by a mobile hamburger menu containing sort toggle and category filters.
- **SC-013**: At ≤720 px, role card and assignment row periods are stacked above the title, not inline right.
- **SC-014**: All page `h1` elements remain in the DOM (for SEO) but are visually hidden via sr-only styling.
