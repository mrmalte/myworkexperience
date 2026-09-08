# Implementation Plan: LinkedIn Export

**Branch**: `007-linkedin-export` | **Date**: 2026-09-07 | **Spec**: [specs/007-linkedin-export/spec.md](spec.md)
**Input**: Feature specification from `/specs/007-linkedin-export/spec.md`

## Summary

Add a fourth render target to the existing content pipeline: a build-time text export shaped to
LinkedIn's profile fields. `tools/build-linkedin.ts` reads the compiled `site-content.json` (same
input as `build-pdf.ts` and `build-docx.ts`) plus a new authored source pair
`specs-input/linkedin/{en,sv}.txt`, and writes `linkedin/linkedin-{lang}.md` — a working document
whose paste blocks are fenced plain text, annotated with character counts against LinkedIn's field
limits.

The one piece of real logic is **nesting**: LinkedIn models employers as positions and has no level
for consultancy assignments, so `cv.assignments` must be folded into the `cv.roles` entry they were
performed under. Organization alone is not sufficient — three employers have two employment entries
each — so placement is decided by organization plus period (see [research.md](research.md) R2).

Output lives outside `public/` and is git-ignored: it is a maintainer artifact, never served and
never deployed. Nothing about the site, the schema or the existing renderers changes.

**Build order**: `content:build` → `linkedin:build`. Independent of `pdf:build`, `docx:build` and
`next build`; deliberately absent from `deploy:full`.

## Technical Context

**Language/Version**: TypeScript (strict), Node.js, executed via `tsx`
**Primary Dependencies**: None beyond `tsx` — Node's `fs`/`path` only. No new package.
**Storage**: File-based; reads `public/content/site-content.json` and `specs-input/linkedin/{en,sv}.txt`, writes `linkedin/linkedin-{en,sv}.md`
**Testing**: Manual verification per [quickstart.md](quickstart.md); no test suite exists in this repo
**Target Platform**: macOS/Linux build environment (local only — the output is never deployed)
**Project Type**: Build tool (CLI script)
**Performance Goals**: Both language files generated in under 5 seconds (SC-001 allows a minute; this is pure text formatting over ~50 entries)
**Constraints**: No network access (FR-016); no truncation of content (FR-011); deterministic output for unchanged input (FR-014)
**Scale/Scope**: 16 employment entries, 34 assignments, 2 languages, 1 education entry

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| #   | Gate                                      | Status  | Notes                                                                                                                                                  |
| --- | ----------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Output is static HTML/CSS/JS              | ✅ PASS | The site is untouched. This feature adds a local text artifact outside `public/` that is not part of the export and not uploaded by the deploy tool.    |
| 2   | Custom tooling is TypeScript              | ✅ PASS | `tools/build-linkedin.ts`, TypeScript run via `tsx`, matching `build-pdf.ts` / `build-docx.ts`.                                                          |
| 3   | `specs-input/cv/` remains source of truth | ✅ PASS | Reads the generated `site-content.json` for CV data; the one new authored input also lives under `specs-input/`. `linkedin/*.md` is generated, never hand-edited. |

**Post-design re-check (after Phase 1)**: unchanged — all three gates still pass. The design adds no
runtime code, no schema field, and no new dependency; `site-content.json` remains the single
contract between builders and renderers.

## Project Structure

### Documentation (this feature)

```text
specs/007-linkedin-export/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── cli-and-output.md # Phase 1 output (CLI + output-document contract)
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
tools/
└── build-linkedin.ts        # NEW — LinkedIn text generator

specs-input/
└── linkedin/                # NEW — authored LinkedIn-only copy
    ├── en.txt               #   Headline: … + About tail
    └── sv.txt

linkedin/                    # GENERATED, git-ignored, not served, not deployed
├── linkedin-en.md
└── linkedin-sv.md

package.json                 # MODIFIED — linkedin:build script; clean covers linkedin/
.gitignore                   # MODIFIED — ignore /linkedin/
CLAUDE.md                    # MODIFIED — architecture, commands, feature table, renderer count
```

**Structure Decision**: Single-project layout, unchanged. The new tool sits in `tools/` alongside
the other build scripts; `build-docx.ts` is the direct structural reference (same shebang, same
locally-declared `SiteContent` subset, same `LANGS` loop, same delete-then-write pattern).
`build-pdf.ts` and `build-docx.ts` are not touched — the three renderers stay independent.

The output directory is new: `linkedin/` at the repository root rather than `public/`, because
anything under `public/` is copied into `out/` by `next build` and would be published at
`malte.sarner.se/cv/`. The export is a maintainer worksheet with character-count annotations and an
"unmatched assignments" diagnostics section; it is not site content.

## Complexity Tracking

> No constitution violations — no justification needed.
