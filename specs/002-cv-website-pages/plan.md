# Implementation Plan: CV Website Pages — Phase 11

**Branch**: `002-cv-website-pages` | **Date**: 2026-04-29 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-cv-website-pages/spec.md`

## Summary

Four incremental improvements to the existing CV website (items 1–3 completed in Phase 10; item 4 is the current Phase 11 work):

1. ~~**Search includes technologies** (User Story 2b)~~: ✅ Completed — `technologies` field added to CVEntry JSON output.
2. ~~**Description paragraph rendering** (FR-024 update)~~: ✅ Completed — descriptions render as separate paragraphs.
3. ~~**About page HTML rendering**~~: ✅ Completed — about text renders embedded HTML links.
4. **Responsive mobile layout** (User Story 5 / FR-040–FR-052): Add mobile-first responsive breakpoint at ≤720 px with hamburger menu, summary truncation, stacked card layouts, mobile tech filter nav, and sr-only H1 titles.

## Technical Context

**Language/Version**: TypeScript 5.x, Next.js 15 (App Router, `output: "export"`)
**Primary Dependencies**: React 19, Tailwind CSS, @emailjs/browser
**Storage**: Static JSON file (`public/content/site-content.json`)
**Testing**: `npm run content:check` (build + schema validation), `npx tsc --noEmit`
**Target Platform**: Static site (any HTTP server)
**Project Type**: Static website with TypeScript build pipeline
**Constraints**: Static output only (constitution), no server-side rendering

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Gate                          | Status | Notes                                                                                                                                                           |
| ----------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I. Static Output First        | PASS   | All changes are build-time or client-side; no server runtime required. Phase 11 responsive changes are CSS/Tailwind utilities and React client components only. |
| II. Build Tools in TypeScript | PASS   | `build-content.ts` changes are TypeScript; output remains HTML/CSS/JS. Phase 11 adds one i18n key to build tool.                                                |
| III. Data Is Source of Truth  | PASS   | `technologies` field comes from existing `meta.txt` source; no new manual data. Phase 11 adds no new data sources — mockup is visual reference only.            |

## Project Structure

### Documentation (this feature)

```text
specs/002-cv-website-pages/
├── plan.md              # This file
├── research.md          # Phase 0 output (R11 added)
├── data-model.md        # Already updated (technologies field on CVEntry)
├── quickstart.md        # No changes needed
├── contracts/           # Schema update needed
└── tasks.md             # Phase 2 output
```

### Source Code (files to modify)

```text
tools/build-content.ts           # Add technologies[] to CVEntry output
                                 # Add ui.cv.showMoreSummary i18n key
lib/content/loadContent.ts       # Add technologies to CVEntry interface
components/HamburgerDrawer.tsx   # NEW: Reusable hamburger menu + drawer component
                                 #   Used by Menu.tsx and TechChart.tsx on mobile
components/Menu.tsx              # Refactor to support responsive hamburger menu:
                                 #   - Use HamburgerDrawer for mobile nav
                                 #   - Add mobile nav drawer with lang toggle + links
                                 #   - Add active page label next to hamburger
components/CvSections.tsx        # 1) Include technologies in search haystack
                                 #    2) Render description as paragraphs
                                 #    3) Mobile stacked period layout (CSS)
components/CvPageClient.tsx      # Add summary truncation with "Show all" on mobile
                                 # Add sr-only H1
components/TechChart.tsx         # Add mobile filter hamburger nav using HamburgerDrawer
                                 # Hide desktop filter row on mobile
components/ContactForm.tsx       # Mobile: full-width submit, 16px inputs
app/[lang]/page.tsx              # Add sr-only H1
app/[lang]/about/page.tsx        # Render about text with dangerouslySetInnerHTML
                                 # Add sr-only H1
app/[lang]/contact/page.tsx      # Add sr-only H1
app/[lang]/technologies/page.tsx # Add sr-only H1
app/not-found.tsx                # Add sr-only H1
app/globals.css                  # Add sr-only utility class
                                 # Add mobile breakpoint responsive styles
specs/002-cv-website-pages/
  contracts/site-content.schema.json  # Add technologies to CVEntry schema
                                       # Add ui.cv.showMoreSummary
```

## Complexity Tracking

No constitution violations — section not applicable.
