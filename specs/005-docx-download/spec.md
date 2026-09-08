# Feature Specification: DOCX Download

**Feature Branch**: `005-docx-download`  
**Created**: 2026-06-01  
**Status**: Draft  
**Input**: Add build-time Word document (.docx) generation alongside the existing PDF generation, and update the navigation download UI from a single PDF link to a Download dropdown that offers both PDF and Word format options.

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Build-time DOCX generation (Priority: P1)

As a site maintainer, I want to run a build command that generates Word document versions of the CV (one per language) so that visitors can download the CV in an editable format commonly used by recruiters and HR systems.

**Why this priority**: Without the DOCX files, there is nothing to offer as a Word download — this is the foundation for every other story.

**Independent Test**: Run the DOCX build command, then verify that correctly named .docx files appear in the output directory with the expected CV content.

**Acceptance Scenarios**:

1. **Given** `site-content.json` contains valid CV data for English and Swedish, **When** the maintainer runs the DOCX build command, **Then** two Word files are created: `cv-en-YYYY-MM-DD.docx` and `cv-sv-YYYY-MM-DD.docx` where the date comes from `ui.pdf.date` in site-content.json.
2. **Given** previous DOCX files (`cv-en-2026-04-01.docx`, `cv-sv-2026-04-01.docx`) already exist in the output directory, **When** the DOCX build command runs, **Then** the old files are deleted before the new ones are generated.
3. **Given** the DOCX build command completes successfully, **When** the maintainer opens a generated Word document, **Then** it contains: person name and role, summary text, education section, all role entries (fully expanded), all assignment entries (fully expanded with per-entry technologies), and a global technologies section.
4. **Given** the generated DOCX, **When** the maintainer inspects the document styling, **Then** headings use Cambria and body text uses Calibri.

---

### User Story 2 — Download dropdown UI (Priority: P1)

As a website visitor, I want to click a "Download" button in the navigation bar and choose between PDF and Word formats so that I can save the CV in my preferred format.

**Why this priority**: This is the primary user-facing interaction — visitors must be able to discover and choose between the available download formats.

**Independent Test**: Visit the website (with PDFs and DOCX files already built), click the download dropdown, select each format, and verify the correct file downloads.

**Acceptance Scenarios**:

1. **Given** the website is loaded, **When** the visitor looks at the desktop navigation, **Then** they see a "↓ Download" button (labeled using `ui.nav.download`) after the Contact link.
2. **Given** the visitor clicks the download button, **When** the dropdown opens, **Then** it shows two options: "PDF" (labeled using `ui.nav.pdf`) and "Word" (labeled using `ui.nav.word`).
3. **Given** the dropdown is open and the site is in English, **When** the visitor clicks "PDF", **Then** the browser downloads `cv-en-YYYY-MM-DD.pdf`.
4. **Given** the dropdown is open and the site is in English, **When** the visitor clicks "Word", **Then** the browser downloads `cv-en-YYYY-MM-DD.docx`.
5. **Given** the website is viewed on a mobile device, **When** the visitor opens the hamburger menu, **Then** the download dropdown is accessible among the navigation items.
6. **Given** the visitor switches language from English to Swedish, **When** they open the download dropdown, **Then** both PDF and Word links point to the Swedish-language files.
7. **Given** the dropdown is open, **When** the visitor clicks outside the dropdown, **Then** the dropdown closes.

---

### User Story 3 — Deploy workflow integration (Priority: P2)

As a site maintainer, I want DOCX generation to happen automatically as part of the full deploy command so that I do not forget to rebuild Word documents before publishing.

**Why this priority**: Automation prevents stale or missing DOCX files on the live site, but the individual build command (Story 1) is sufficient for a working MVP.

**Independent Test**: Run the full deploy command and verify that fresh DOCX files are generated and included in the deployment.

**Acceptance Scenarios**:

1. **Given** site content has been updated, **When** the maintainer runs the full deploy command, **Then** DOCX files are regenerated before deployment begins, after PDF generation.
2. **Given** the DOCX generation step fails, **When** the full deploy command is running, **Then** the deploy halts and reports the error.
3. **Given** the deploy pipeline runs, **When** inspecting the execution order, **Then** it follows: content:build → pdf:build → docx:build → next build → deploy.

---

### User Story 4 — Server cleanup of stale DOCX files (Priority: P2)

As a site maintainer, I want the deploy process to remove outdated DOCX files from the server so that visitors never download a stale CV.

**Why this priority**: Without cleanup, the server accumulates old dated DOCX files over time, wasting space and potentially confusing search engines.

**Independent Test**: Deploy with new DOCX files, then verify that only the current build's DOCX files remain on the server and previous dated files have been removed.

**Acceptance Scenarios**:

1. **Given** the server has `cv-en-2026-04-01.docx` and `cv-sv-2026-04-01.docx` from a previous deploy, **When** a new deploy runs (build date 2026-06-01), **Then** the old files are deleted and only `cv-en-2026-06-01.docx` and `cv-sv-2026-06-01.docx` remain.
2. **Given** the server has no previous DOCX files, **When** a new deploy runs, **Then** only the current build's DOCX files are uploaded (no errors from missing old files).

---

### Edge Cases

- What happens when `site-content.json` is missing or malformed? The DOCX build command should exit with a clear error before attempting generation.
- What happens when the `docx` npm package is not installed? The build command should fail with a clear dependency error.
- What happens when the download dropdown is clicked but no files have been built yet (dev environment)? The browser shows a 404 — this is acceptable during development.
- What happens when only PDF files exist but not DOCX files? The dropdown still shows both options; the Word link returns 404. This is an acceptable dev-time scenario.
- What happens when the date changes between the content build and the DOCX build? The date is read from `ui.pdf.date` in site-content.json (written during content:build), so there is no drift.
- What happens if the dropdown is opened and the user navigates away? The dropdown closes on route change.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The project MUST provide a build tool (`tools/build-docx.ts`) that reads `site-content.json` and generates one Word document (.docx) per supported language using programmatic document construction (NOT HTML-to-docx conversion).
- **FR-002**: Generated DOCX files MUST be named `cv-{lang}-{YYYY-MM-DD}.docx` where `{lang}` is the language code and `{YYYY-MM-DD}` is the date read from `ui.pdf.date` in site-content.json.
- **FR-003**: The build tool MUST place generated DOCX files in the `public/` directory. The DOCX build MUST run before `next build` so that files are included in the static export.
- **FR-004**: The build tool MUST delete any existing `cv-*.docx` files from the `public/` directory before generating new ones.
- **FR-005**: The DOCX content MUST include: person name and role, summary text, education entries, all role entries (fully expanded), all assignment entries (fully expanded with per-entry technologies), and a global technologies section.
- **FR-006**: Each assignment entry in the DOCX MUST display its technologies beneath the description, formatted as "Technologies: tech1, tech2, tech3". Entries with no technologies MUST omit the line. Education and role entries MUST NOT display per-entry technologies.
- **FR-007**: The DOCX styling MUST use Calibri as the body font and Cambria as the heading font.
- **FR-008**: The DOCX build tool MUST be invocable via `npm run docx:build`.
- **FR-009**: The `docx` npm package MUST be added as a devDependency.
- **FR-010**: The website navigation MUST replace the single PDF download link with a dropdown button labeled with the `ui.nav.download` content field.
- **FR-011**: The download dropdown MUST offer two options: "PDF" (using `ui.nav.pdf` label) and "Word" (using `ui.nav.word` label).
- **FR-012**: The download dropdown MUST appear after the Contact link in the navigation order, on both desktop and mobile layouts.
- **FR-013**: Each download option MUST use a standard anchor element with a `download` attribute pointing to the correct file for the current language.
- **FR-013a**: Because FR-013 mandates raw anchors, both download hrefs MUST include the deployment base path explicitly — framework base-path handling does not apply to them. See [006 FR-003](../006-base-path-deploy/spec.md).
- **FR-014**: When the visitor switches language, all download links MUST update to reference the correct language's files.
- **FR-015**: The dropdown MUST close when the visitor clicks outside it or navigates to another page.
- **FR-016**: The `deploy:full` script MUST include `docx:build` in the pipeline in this order: content:build → pdf:build → docx:build → next build → deploy.
- **FR-017**: The deployment tool (`tools/deploy-ftp.ts`) MUST remove DOCX files from the server that do not match the current build's filenames (files matching the `cv-*.docx` pattern).
- **FR-018**: New content fields MUST be added: `ui.nav.download` (dropdown button label) and `ui.nav.word` (Word option label). The existing `ui.nav.pdf` field MUST be reused for the PDF option.

### Key Entities

- **DOCX File**: A Word document containing the full CV content for one language. Named with language code and build date.
- **Site Content**: The `site-content.json` data file that serves as the single source of truth for both the website and document generation.
- **Download Dropdown**: The navigation UI element that replaces the single PDF link with a multi-format download menu.
- **Content Labels**: Localized UI strings (`ui.nav.download`, `ui.nav.pdf`, `ui.nav.word`) that drive the dropdown's displayed text.

## Assumptions

- The build environment has Node.js available to run the `docx` npm package for programmatic document construction.
- The `docx` package is sufficient for generating professional-looking Word documents without needing a headless Word processor.
- Calibri and Cambria font references in the .docx file will render correctly when opened on systems with Microsoft Office or compatible word processors (font embedding is not required).
- The `public/` directory convention (files copied into the static export) is maintained by the framework.
- The DOCX date is read from `ui.pdf.date` in `site-content.json` (same field used by PDF generation), eliminating date drift between formats.
- During development, the download links may return 404 if the build commands have not been run — this is acceptable.
- The dropdown UI behavior (open/close) can be implemented with standard browser interactions without requiring a third-party component library.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A site maintainer can generate DOCX versions of the CV for all supported languages with a single command in under 30 seconds.
- **SC-002**: Generated Word documents contain all CV sections fully expanded — no content is truncated or missing.
- **SC-003**: Website visitors can find and open the download dropdown within 5 seconds of looking at the navigation bar.
- **SC-004**: Visitors can download both PDF and Word formats from the dropdown, with each link correctly referencing the active language's file.
- **SC-005**: After a full deploy, the live server contains only the current build's DOCX files — no stale dated files remain.
- **SC-006**: The full deploy command completes successfully with DOCX generation included, without requiring separate manual steps.
