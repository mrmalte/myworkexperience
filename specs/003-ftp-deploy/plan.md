# Implementation Plan: FTP Deploy

**Branch**: `003-ftp-deploy` | **Date**: 2026-04-23 | **Spec**: [specs/003-ftp-deploy/spec.md](spec.md)
**Input**: Feature specification from `/specs/003-ftp-deploy/spec.md`

## Summary

Deploy the static Next.js site to shared hosting via FTP. A TypeScript CLI script (`tools/deploy-ftp.ts`) uploads the `out/` build output using `basic-ftp`, with FTPS-first fallback to plain FTP. Credentials are managed via environment variables / `.env.local`. An `.htaccess` file in `public/` configures Apache 2.4 security response headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options).

## Technical Context

**Language/Version**: TypeScript (ES2020 target), Node.js, Next.js 15  
**Primary Dependencies**: `basic-ftp` ^5.3.0, `dotenv`, `tsx` (runner)  
**Storage**: N/A (file-based static export to `out/`)  
**Testing**: Manual verification (curl -I against live site)  
**Target Platform**: Shared hosting — Apache 2.4, FTP/FTPS  
**Project Type**: CLI deploy script + static hosting configuration  
**Performance Goals**: Full site deploy < 5 minutes (SC-001)  
**Constraints**: Must work with common FTP servers; FTPS preferred; `.htaccess` requires `mod_headers` enabled  
**Scale/Scope**: Single maintainer, single site, ~100–200 static files

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| #   | Gate                                      | Status  | Notes                                                                           |
| --- | ----------------------------------------- | ------- | ------------------------------------------------------------------------------- |
| 1   | Output is static HTML/CSS/JS              | ✅ PASS | `next build` with `output: "export"` produces static `out/` directory           |
| 2   | Custom tooling is TypeScript              | ✅ PASS | `tools/deploy-ftp.ts` is TypeScript, executed via `tsx`                         |
| 3   | `specs-input/cv/` remains source of truth | ✅ PASS | This feature does not modify content pipeline; it only uploads the build output |

**Additional notes**: The `.htaccess` file is a static configuration file placed in `public/` — it is not generated or dynamic, so it doesn't conflict with any constitution principle.

## Project Structure

### Documentation (this feature)

```text
specs/003-ftp-deploy/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (CLI interface contract)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
tools/
└── deploy-ftp.ts        # FTP deploy script (already implemented)

public/
└── .htaccess            # Apache security headers (copied to out/ by Next.js build)
```

**Structure Decision**: Single-project layout. The deploy script lives in the existing `tools/` directory alongside other build tooling. The `.htaccess` sits in `public/` so Next.js automatically copies it to the `out/` static export directory during build.

## Complexity Tracking

> No constitution violations — no justification needed.

## Post-Design Constitution Re-check

| #   | Gate                                      | Status  | Notes                                                                                        |
| --- | ----------------------------------------- | ------- | -------------------------------------------------------------------------------------------- |
| 1   | Output is static HTML/CSS/JS              | ✅ PASS | Build output is static. `.htaccess` is a static config file. No server-side rendering.       |
| 2   | Custom tooling is TypeScript              | ✅ PASS | `tools/deploy-ftp.ts` is TypeScript. `.htaccess` is not tooling — it's a static config file. |
| 3   | `specs-input/cv/` remains source of truth | ✅ PASS | Deploy feature does not modify content pipeline.                                             |

No violations — table omitted.
