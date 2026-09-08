# Feature Specification: PDF Download

**Feature Branch**: `004-pdf-download`  
**Created**: 2026-05-08  
**Status**: Draft  
**Input**: Add a "Download PDF" feature to the CV website with build-time PDF generation via Puppeteer, a navigation download link, and deployment cleanup of old PDF files.

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Generate PDF versions of the CV at build time (Priority: P1)

As a site maintainer, I want the build process to generate PDF versions of the CV (one per language) so that visitors can download a professional, print-ready document.

**Why this priority**: Without the PDF files, there is nothing to download — this is the foundation for every other story.

**Independent Test**: Run the PDF build command, then verify that correctly named PDF files appear in the output directory with the expected CV content.

**Acceptance Scenarios**:

1. **Given** `site-content.json` contains valid CV data for English and Swedish, **When** the maintainer runs the PDF build command, **Then** two PDF files are created: `cv-en-YYYY-MM-DD.pdf` and `cv-sv-YYYY-MM-DD.pdf` where the date is today's date.
2. **Given** previous PDF files (`cv-en-2026-04-01.pdf`, `cv-sv-2026-04-01.pdf`) already exist in the output directory, **When** the PDF build command runs, **Then** the old files are deleted before the new ones are generated.
3. **Given** the PDF build command completes successfully, **When** the maintainer opens a generated PDF, **Then** it contains: summary text, education section, all positions (fully expanded), all assignments (fully expanded), and technologies listed by category in compact text format.
4. **Given** the PDF build command completes, **When** the maintainer inspects the PDF styling, **Then** headings use a serif font, body text uses a sans-serif font, and colors match the website's visual identity.
5. **Given** the generated PDF, **When** the maintainer checks the page layout, **Then** each page is A4 size with sensible margins suitable for printing.

---

### User Story 2 — Download PDF from the website navigation (Priority: P1)

As a website visitor, I want to click a download link in the navigation bar so that I can save the CV as a PDF file to my device.

**Why this priority**: This is the primary user-facing interaction — the download must be discoverable and functional.

**Independent Test**: Visit the website (with PDFs already built), click the PDF download link, and verify the correct file downloads.

**Acceptance Scenarios**:

1. **Given** the website is loaded in English, **When** the visitor clicks the PDF download link in the desktop navigation, **Then** the browser downloads `cv-en-YYYY-MM-DD.pdf`.
2. **Given** the website is loaded in Swedish, **When** the visitor clicks the PDF download link in the desktop navigation, **Then** the browser downloads `cv-sv-YYYY-MM-DD.pdf`.
3. **Given** the website is viewed on a mobile device, **When** the visitor opens the hamburger menu, **Then** the PDF download link is visible among the navigation links.
4. **Given** the visitor switches from English to Swedish, **When** they look at the PDF download link, **Then** the link now points to the Swedish PDF file.
5. **Given** no PDF has been built yet (dev environment), **When** the visitor clicks the download link, **Then** the browser shows a 404 — this is acceptable during development.

---

### User Story 3 — PDF generation included in full deploy workflow (Priority: P2)

As a site maintainer, I want PDF generation to happen automatically as part of the full deploy command so that I do not forget to rebuild PDFs before publishing.

**Why this priority**: Automation prevents stale or missing PDFs on the live site, but the individual build command (Story 1) is sufficient for a working MVP.

**Independent Test**: Run the combined deploy command and verify that fresh PDFs are generated and included in the deployment.

**Acceptance Scenarios**:

1. **Given** site content has been updated, **When** the maintainer runs the full deploy command, **Then** PDF files are regenerated with the current date before deployment begins.
2. **Given** the PDF generation step fails, **When** the full deploy command is running, **Then** the deploy halts and reports the error.

---

### User Story 4 — Old PDF files cleaned up on the server during deployment (Priority: P2)

As a site maintainer, I want the deploy process to remove outdated PDF files from the server so that visitors never download a stale CV.

**Why this priority**: Without cleanup, the server accumulates old dated PDF files over time, wasting space and potentially confusing search engines.

**Independent Test**: Deploy with new PDFs, then verify that only the current build's PDF files remain on the server and previous dated files have been removed.

**Acceptance Scenarios**:

1. **Given** the server has `cv-en-2026-04-01.pdf` and `cv-sv-2026-04-01.pdf` from a previous deploy, **When** a new deploy runs (build date 2026-05-08), **Then** the old files are deleted and only `cv-en-2026-05-08.pdf` and `cv-sv-2026-05-08.pdf` remain.
2. **Given** the server has no previous PDF files, **When** a new deploy runs, **Then** only the current build's PDF files are uploaded (no errors from missing old files).

---

### Edge Cases

- What happens when `site-content.json` is missing or malformed? The PDF build command should exit with a clear error before attempting PDF generation.
- What happens when the build environment does not have a compatible headless browser available? The PDF build command should report a clear error about the missing dependency.
- What happens when the PDF link is clicked on a browser that does not support the `download` attribute? The browser should fall back to navigating to the PDF, which the browser can still display or download natively.
- What happens when the date changes between the content build and the PDF build (e.g., build runs at midnight)? The date is written once during `content:build` into `site-content.json` (`ui.pdf.date`); `build-pdf.ts` reads it from there. Since both the website and PDF use the same stored date, there is no drift. A midnight rollover requires re-running `content:build`.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The project MUST provide a build tool that reads `site-content.json` and generates one PDF per supported language.
- **FR-002**: Generated PDF files MUST be named `cv-{lang}-{YYYY-MM-DD}.pdf` where `{lang}` is the language code and `{YYYY-MM-DD}` is the build date.
- **FR-003**: The build tool MUST place generated PDF files in the `public/` directory. The PDF build MUST run before `next build` so that PDFs are included in the static export automatically.
- **FR-004**: The build tool MUST delete any existing `cv-*.pdf` files from the `public/` directory before generating new ones.
- **FR-005**: The PDF content MUST include: summary text, education section, all positions (fully expanded, no truncation), all assignments (fully expanded), and technologies listed by category in compact text format (`Category: tech1, tech2, tech3`).
- **FR-006**: The PDF MUST NOT include a search bar or any interactive UI elements.
- **FR-007**: The PDF styling MUST match the website's visual identity: Fraunces (serif) for headings, Instrument Sans (sans-serif) for body text, and the site's color palette (--accent: #1a6b4a, --text: #1a1816, --mid: #7a756d, --line: #e5e2dc).
- **FR-008**: The PDF MUST use A4 page size with 20mm margins on all sides.
- **FR-009**: The PDF build tool MUST be invocable via an npm script.
- **FR-010**: The full deploy workflow MUST include PDF generation as a step before deployment.
- **FR-011**: The website navigation MUST include a PDF download link visible on both desktop and mobile layouts.
- **FR-012**: The PDF download link MUST appear after the Contact link in the navigation order.
- **FR-013**: The PDF download link MUST use a standard anchor element with a `download` attribute, not a client-side navigation component.
- **FR-013a**: Because FR-013 mandates a raw anchor, the link href MUST include the deployment base path explicitly. Framework base-path handling applies only to client-side navigation components, so without an explicit prefix this link resolves against the domain root and 404s while the rest of the site works. See [006 FR-003](../006-base-path-deploy/spec.md).
- **FR-014**: The PDF download link MUST point to the PDF file matching the current language.
- **FR-015**: When the visitor switches language, the PDF download link MUST update to reference the correct language's PDF file.
- **FR-016**: The UI label for the PDF download link MUST be included in the site's content/localization data.
- **FR-017**: The deployment tool MUST remove PDF files from the server that do not match the current build's filenames (files matching the `cv-*.pdf` pattern).
- **FR-018**: The build environment MUST have a headless browser available for PDF rendering.
- **FR-019**: The content build tool (`build-content.ts`) MUST write a `ui.pdf.date` field (formatted `YYYY-MM-DD`, derived from the build date) into `site-content.json`. Both the PDF build tool and the website navigation component MUST read the date from this field — neither may derive it independently from `new Date()` at runtime.
- **FR-020**: Each assignment entry in the PDF MUST display its technologies beneath the description, formatted as "Technologies: tech1, tech2, tech3" using the same `.tech-row`/`.tech-cat` styling as the global technologies section. Entries with no technologies MUST omit the line. Education and role entries MUST NOT display per-entry technologies.

### Key Entities

- **PDF File**: A print-ready document containing the full CV content for one language. Named with language code and build date.
- **Site Content**: The `site-content.json` data file that serves as the single source of truth for both the website and PDF generation.
- **Navigation Link**: The download link element added to the website's desktop and mobile navigation.

## Assumptions

- The build environment has sufficient resources to run a headless browser for PDF rendering.
- The headless browser dependency is managed as a development dependency and not required at runtime.
- Google Fonts are accessible from the build environment at build time for font loading in the PDF HTML template.
- The `public/` directory convention (files copied into the static export) is maintained by the framework.
- The PDF date is stored in `site-content.json` during `content:build`, eliminating date drift between PDF filenames and download links.
- During development, the PDF download link may return a 404 if the PDF build has not been run — this is acceptable and documented.
- CI/CD environments will need a compatible headless browser installed.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A site maintainer can generate PDF versions of the CV for all supported languages with a single command in under 60 seconds.
- **SC-002**: Generated PDFs render all CV sections fully expanded — no content is truncated or hidden behind interactive elements.
- **SC-003**: Website visitors can find and click the PDF download link within 5 seconds of looking at the navigation bar.
- **SC-004**: The PDF download link correctly references the active language's file — switching language updates the link immediately.
- **SC-005**: After a full deploy, the live server contains only the current build's PDF files — no stale dated files remain.
- **SC-006**: The generated PDF is visually consistent with the website's typography and color scheme when viewed side-by-side.
- **SC-007**: The full deploy command completes successfully with PDF generation included, without requiring separate manual steps.
