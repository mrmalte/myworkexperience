# Implementation Plan: DOCX Download

**Branch**: `005-docx-download` | **Date**: 2026-06-01 | **Spec**: [specs/005-docx-download/spec.md](spec.md)
**Input**: Feature specification from `/specs/005-docx-download/spec.md`

## Summary

Add build-time Word document (.docx) generation of the CV (one per language) using the `docx` npm package for programmatic document construction, replace the single PDF download link with a dropdown offering both PDF and Word formats, and extend the FTP deploy cleanup to cover stale .docx files. The DOCX build tool reads `site-content.json`, constructs a `Document` with `Sections → Paragraphs/Tables`, and outputs to `public/` for inclusion in the static export.

**Build order**: `content:build` → `pdf:build` → `docx:build` → `next build` → `deploy`. The content build writes `ui.pdf.date` into `site-content.json`. The DOCX build reads that date for filenames. Since DOCX files are placed in `public/` before `next build`, they're included in the static export automatically. The Menu component reads `ui.pdf.date` and the new `ui.nav.download`/`ui.nav.word` labels from content data to construct the dropdown.

## Technical Context

**Language/Version**: TypeScript (ES2020 target), Node.js, Next.js 15, React 19  
**Primary Dependencies**: `docx` (devDependency for programmatic Word document construction), `tsx` (runner)  
**Storage**: N/A (file-based; reads `public/content/site-content.json`, writes DOCX to `public/`)  
**Testing**: Manual verification (open generated DOCX files, check content and styling)  
**Target Platform**: macOS/Linux build environment, static hosting (Apache)  
**Project Type**: Build tool (CLI script) + website UI modification  
**Performance Goals**: DOCX generation < 30 seconds for both languages (SC-001)  
**Constraints**: No font embedding required (Calibri/Cambria are universally available on target systems)  
**Scale/Scope**: 2 DOCX files generated per build (en, sv); download dropdown with 2 options in nav

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| #   | Gate                                      | Status  | Notes                                                                                              |
| --- | ----------------------------------------- | ------- | -------------------------------------------------------------------------------------------------- |
| 1   | Output is static HTML/CSS/JS              | ✅ PASS | DOCX files are static files placed in `public/` and included in the `out/` export. No SSR.         |
| 2   | Custom tooling is TypeScript              | ✅ PASS | `tools/build-docx.ts` is TypeScript executed via `tsx`                                             |
| 3   | `specs-input/cv/` remains source of truth | ✅ PASS | DOCX reads from `site-content.json` (generated from `specs-input/`). Source of truth is unchanged. |

## Project Structure

### Documentation (this feature)

```text
specs/005-docx-download/
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
├── build-docx.ts        # NEW — docx package Word generator
├── build-content.ts     # MODIFIED — add ui.nav.download and ui.nav.word strings
└── deploy-ftp.ts        # MODIFIED — extend cleanup to cover cv-*.docx

components/
└── Menu.tsx             # MODIFIED — replace single PDF link with download dropdown

public/
├── cv-en-YYYY-MM-DD.docx # GENERATED — English CV DOCX
└── cv-sv-YYYY-MM-DD.docx # GENERATED — Swedish CV DOCX

package.json             # MODIFIED — docx devDep, docx:build script, deploy:full update
```

**Structure Decision**: Single-project layout. The new build tool lives in `tools/` alongside existing build scripts (`build-pdf.ts` is the direct structural reference). DOCX output goes to `public/` (same as PDFs). UI changes are confined to `Menu.tsx` (dropdown replaces single link) and `build-content.ts` (new label strings).

## Complexity Tracking

> No constitution violations — no justification needed.

## Post-Design Constitution Re-check

| #   | Gate                                      | Status  | Notes                                                                                                                                                                                                   |
| --- | ----------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Output is static HTML/CSS/JS              | ✅ PASS | DOCX files are static files in `public/`. Website remains a static export. Dropdown uses client-side `useState` — no SSR introduced.                                                                    |
| 2   | Custom tooling is TypeScript              | ✅ PASS | `tools/build-docx.ts` is TypeScript. `docx` is a devDependency used only at build time.                                                                                                                 |
| 3   | `specs-input/cv/` remains source of truth | ✅ PASS | DOCX reads from generated `site-content.json`. New UI strings (`ui.nav.download`, `ui.nav.word`) are hardcoded in `build-content.ts` (same pattern as all other UI strings). Source pipeline unchanged. |

No violations — complexity table omitted.
