# Implementation Plan: CV Website Pages — Phase 13

**Branch**: `002-cv-website-pages` | **Date**: 2026-08-11 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-cv-website-pages/spec.md`

## Summary

Six incremental improvements to the existing CV website (items 1–5 completed in Phases 10–12; item 6 is current work):

1. ~~**Search includes technologies** (User Story 2b)~~: ✅ Completed — `technologies` field added to CVEntry JSON output.
2. ~~**Description paragraph rendering** (FR-024 update)~~: ✅ Completed — descriptions render as separate paragraphs.
3. ~~**About page HTML rendering**~~: ✅ Completed, then superseded by item 6 (page removed).
4. ~~**Responsive mobile layout** (User Story 5 / FR-040–FR-052)~~: ✅ Completed — ≤720 px breakpoint with hamburger menu, summary truncation, stacked card layouts, mobile tech filter nav, and sr-only H1 titles.
5. ~~**Technology tags on CV cards** (FR-053–FR-054 / SC-015)~~: ✅ Completed — `CVEntry.technologies[]` renders as inline tag pills in expanded cards.
6. **Remove the About page** (FR-001/FR-003/FR-011b/FR-025/FR-043 / SC-016): Retire the About page end-to-end — route, redirect, nav entries (desktop + mobile drawer), source content, generated content field, schema definition, TypeScript types, and the mockup's About page. The site drops from four pages to three.

### Phase 13 approach

Removal is a straight subtraction along the existing content pipeline, executed source-first so nothing is left dangling:

`specs-input/about/` → `parseSource.ts` → `build-content.ts` → `site-content.schema.json` → `loadContent.ts` → `Menu.tsx` → route files → mockup.

Two ordering constraints matter:

- The JSON Schema lists `about` in its top-level `required` array. The schema and `build-content.ts` MUST change together, otherwise `npm run content:validate` fails on whichever side is updated first.
- `site-content.json` is a git-ignored build artifact. It is not edited by hand (constitution III); it is regenerated via `npm run content:build` and the stale `about` key disappears on its own.

Removed routes are not redirected anywhere. `/en/about` and `/sv/about` simply cease to exist in the static export and fall through to the not-found page (FR-031) — no redirect stub is kept, since the page has no successor page to point at.

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

| Gate                          | Status | Notes                                                                                                                                              |
| ----------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| I. Static Output First        | PASS   | Phase 13 removes a static route; output remains plain HTML/CSS/JS with no server runtime.                                                          |
| II. Build Tools in TypeScript | PASS   | `parseSource.ts` and `build-content.ts` stay TypeScript; Phase 13 only deletes code from them.                                                     |
| III. Data Is Source of Truth  | PASS   | `specs-input/about/` is deleted at the source, and `site-content.json` is regenerated rather than hand-edited so the `about` key drops out.        |

## Project Structure

### Documentation (this feature)

```text
specs/002-cv-website-pages/
├── plan.md              # This file (Phase 13)
├── research.md          # R12 added (About removal decisions)
├── data-model.md        # about row + ui.nav.about row removed
├── quickstart.md        # Route table + source layout updated
├── contracts/           # site-content.schema.json: about + ui.nav.about removed
└── tasks.md             # Phase 13 task list appended
```

### Source Code (Phase 13 — files to delete)

```text
app/[lang]/about/page.tsx        # DELETE — the About page itself
app/about/page.tsx               # DELETE — non-prefixed /about redirect stub
specs-input/about/en.txt         # DELETE — source content (en)
specs-input/about/sv.txt         # DELETE — source content (sv)
specs-input/about/               # DELETE — now-empty directory
```

### Source Code (Phase 13 — files to modify)

```text
tools/content/parseSource.ts     # Drop about from ParsedSource type,
                                 #   drop aboutDir + the two readFileSync calls
tools/build-content.ts           # Drop about from SiteContent type + output object,
                                 #   drop ui.nav.about strings
lib/content/loadContent.ts       # Drop about from SiteContent interface,
                                 #   drop about from UIStrings nav
components/Menu.tsx              # Drop about from navLabels prop type, nav item list,
                                 #   and the pathname→activeKey derivation
specs-input/mockup/scandinavian.html
                                 # Drop desktop nav button, drawer nav button,
                                 #   #page-about section, nav_about + about_text keys
                                 #   (en + sv), and 'about' from the page list
specs/002-cv-website-pages/
  contracts/site-content.schema.json  # Drop about from properties + required,
                                       # drop ui.nav.about from properties + required
```

### Regenerated (not hand-edited)

```text
public/content/site-content.json # Regenerated by `npm run content:build`;
                                 #   about + ui.nav.about disappear automatically
```

## Complexity Tracking

No constitution violations — section not applicable.
