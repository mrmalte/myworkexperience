# Implementation Plan: Base Path Deploy (Subdirectory Hosting)

**Branch**: `006-base-path-deploy` | **Date**: 2026-08-14 | **Spec**: [specs/006-base-path-deploy/spec.md](spec.md)
**Input**: Feature specification from `/specs/006-base-path-deploy/spec.md`

## Summary

Move the deployed site from the domain root to a `/cv` subdirectory using Next.js's built-in `basePath` export config, sourced from a single `NEXT_PUBLIC_BASE_PATH` environment variable read by both `next.config.mjs` and the four raw download anchors in `Menu.tsx` (the only URLs `basePath` doesn't reach, since it only instruments framework-managed link/asset emission). Add a version-controlled but manually-deployed root `.htaccess` with an anchored `RedirectMatch` sending the bare domain to `/cv/`, and repoint the existing FTP deploy remote directory at `/cv` — the deploy tool's stale-file cleanup already parameterizes on that value, so it requires no code change.

**Build order (unchanged)**: `content:build` → `pdf:build` → `docx:build` → `next build` → `deploy`. This feature only changes *where* `next build`'s output resolves and *where* `deploy` uploads it; it does not reorder or add pipeline steps.

## Technical Context

**Language/Version**: TypeScript (ES2020 target), Node.js, Next.js 15 (App Router, `output: "export"`), React 19
**Primary Dependencies**: None new — uses Next.js's built-in `basePath` config option
**Storage**: N/A — this feature touches deployment configuration only, no content data
**Testing**: Manual verification per [quickstart.md](quickstart.md) (grep `out/` for unprefixed URLs, click through a locally-served `/cv`-mounted export, `curl -I` against the live redirect)
**Target Platform**: Static export served from Apache 2.4 under a `/cv` subdirectory; domain root redirect on the same Apache host
**Project Type**: Static website configuration change (build config + one component + Apache config), no new build tool
**Constraints**: `next dev` must remain unprefixed for local development (no `/cv` in the dev URL); the root redirect must not create a loop with its own target
**Scale/Scope**: One new env file, one `next.config.mjs` edit, four anchor hrefs in one component, one new Apache config file, one env var value change for deploy

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| #   | Gate                                      | Status  | Notes                                                                                                          |
| --- | ------------------------------------------ | ------- | ---------------------------------------------------------------------------------------------------------------- |
| 1   | Output is static HTML/CSS/JS              | ✅ PASS | `basePath` is build-time config; output remains a plain static export. No server runtime introduced.             |
| 2   | Custom tooling is TypeScript              | ✅ PASS | No new tooling. `tools/deploy-ftp.ts` is unchanged (already parameterized on `FTP_REMOTE_DIR`, see research R6). |
| 3   | `specs-input/cv/` remains source of truth | ✅ PASS | This feature does not touch content data, `specs-input/`, or `site-content.json` in any way.                     |

## Project Structure

### Documentation (this feature)

```text
specs/006-base-path-deploy/
├── plan.md                       # This file
├── research.md                   # Phase 0 output — R1-R6 decisions
├── data-model.md                 # Phase 1 output — config/deployment "entities"
├── quickstart.md                 # Phase 1 output — validation guide
└── contracts/
    └── root-htaccess.md          # Phase 1 output — root .htaccess content contract
```

### Source Code (files to add/modify)

```text
.env.production                   # NEW, committed (no secret) — NEXT_PUBLIC_BASE_PATH=/cv
.env.local                        # MODIFIED — FTP_REMOTE_DIR changed to /cv
next.config.mjs                   # MODIFIED — add basePath: process.env.NEXT_PUBLIC_BASE_PATH || ""
components/Menu.tsx                # MODIFIED — prefix the 4 raw <a href download> hrefs
                                   #   (desktop PDF, desktop Word, mobile PDF, mobile Word)
                                   #   with process.env.NEXT_PUBLIC_BASE_PATH
deploy/root.htaccess              # NEW, committed — domain-root redirect, uploaded manually
                                   #   (never touched by tools/deploy-ftp.ts or any npm script)
README.md                         # MODIFIED — document /cv as the deployed subdirectory,
                                   #   FTP_REMOTE_DIR (host-specific filesystem path — see R7,
                                   #   not the literal "/cv"), and the manual root-redirect step
```

### Source Code (verified unchanged, per research R3/R6)

```text
app/page.tsx                      # redirect("/en/") — basePath-aware, no change
app/contact/page.tsx              # redirect("/en/contact") — basePath-aware, no change
app/technologies/page.tsx         # redirect("/en/technologies") — basePath-aware, no change
app/not-found.tsx                 # <Link href="/en/"> — basePath-aware, no change
components/Menu.tsx (active-page logic) # usePathname() strips basePath already, no change
tools/deploy-ftp.ts               # already parameterized on FTP_REMOTE_DIR, no change
public/.htaccess                  # unchanged content; now deploys to /cv/.htaccess instead of
                                   #   the domain root — a location change, not a content change
```

**Structure Decision**: Single project (existing Next.js static site). No new services, no new
build tooling, no new directories beyond `deploy/` for the one manually-deployed Apache file that
must live outside `out/` (per [FR-010](spec.md)). All other changes are edits to existing files.

## Complexity Tracking

_No constitution violations — section not applicable._
