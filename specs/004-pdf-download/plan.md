# Implementation Plan: PDF Download

**Branch**: `004-pdf-download` | **Date**: 2026-05-08 | **Spec**: [specs/004-pdf-download/spec.md](spec.md)
**Input**: Feature specification from `/specs/004-pdf-download/spec.md`

## Summary

Add build-time PDF generation of the CV (one per language) using Puppeteer, a navigation download link in the website header, and server-side cleanup of old PDF files during FTP deployment. The PDF build tool renders an HTML template with site content data, produces A4-sized PDFs styled to match the website's visual identity, and outputs them to `public/` for inclusion in the static export.

**Build order**: `content:build` → `pdf:build` → `next build`. The content build writes `ui.pdf.date` (build date) into `site-content.json`. The PDF build reads that date for filenames. Since PDFs are placed in `public/` before `next build`, they're included in the static export automatically. The website's Menu component reads `ui.pdf.date` from content data (passed as a prop from a server component) to construct the download link href — this avoids runtime date derivation in a client component.

## Technical Context

**Language/Version**: TypeScript (ES2020 target), Node.js, Next.js 15, React 19  
**Primary Dependencies**: `puppeteer` (devDependency for headless Chrome PDF rendering), `tsx` (runner)  
**Storage**: N/A (file-based; reads `public/content/site-content.json`, writes PDFs to `public/`)  
**Testing**: Manual verification (open generated PDFs, check content and styling)  
**Target Platform**: macOS/Linux build environment (headless Chromium), static hosting (Apache)  
**Project Type**: Build tool (CLI script) + website UI modification  
**Performance Goals**: PDF generation < 60 seconds for both languages (SC-001)  
**Constraints**: Build environment must support headless Chromium; Google Fonts must be accessible at build time  
**Scale/Scope**: 2 PDFs generated per build (en, sv); single download link per language in nav

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| #   | Gate                                      | Status  | Notes                                                                                             |
| --- | ----------------------------------------- | ------- | ------------------------------------------------------------------------------------------------- |
| 1   | Output is static HTML/CSS/JS              | ✅ PASS | PDFs are static files placed in `public/` and included in the `out/` export. No SSR.              |
| 2   | Custom tooling is TypeScript              | ✅ PASS | `tools/build-pdf.ts` is TypeScript executed via `tsx`                                             |
| 3   | `specs-input/cv/` remains source of truth | ✅ PASS | PDF reads from `site-content.json` (generated from `specs-input/`). Source of truth is unchanged. |

## Project Structure

### Documentation (this feature)

```text
specs/004-pdf-download/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (CLI contract)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
tools/
├── build-pdf.ts         # NEW — Puppeteer PDF generator
├── build-content.ts     # MODIFIED — add ui.nav.pdf strings
└── deploy-ftp.ts        # MODIFIED — add server-side PDF cleanup

components/
└── Menu.tsx             # MODIFIED — add PDF download <a> link

public/
├── cv-en-YYYY-MM-DD.pdf # GENERATED — English CV PDF
└── cv-sv-YYYY-MM-DD.pdf # GENERATED — Swedish CV PDF

package.json             # MODIFIED — puppeteer devDep, pdf:build script, deploy:full update
```

**Structure Decision**: Single-project layout. The new build tool lives in `tools/` alongside existing build scripts. PDF output goes to `public/` (same as other static assets). UI changes are minimal — one component file.

## Complexity Tracking

> No constitution violations — no justification needed.

## Post-Design Constitution Re-check

| #   | Gate                                      | Status  | Notes                                                                                                                                                                      |
| --- | ----------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Output is static HTML/CSS/JS              | ✅ PASS | PDFs are static files in `public/`. Website remains a static export. No server-side rendering introduced.                                                                  |
| 2   | Custom tooling is TypeScript              | ✅ PASS | `tools/build-pdf.ts` is TypeScript. Puppeteer is a devDependency used only at build time.                                                                                  |
| 3   | `specs-input/cv/` remains source of truth | ✅ PASS | PDF reads from generated `site-content.json`. The `ui.nav.pdf` label is hardcoded in `build-content.ts` (same pattern as all other UI strings). Source pipeline unchanged. |

No violations — complexity table omitted.
