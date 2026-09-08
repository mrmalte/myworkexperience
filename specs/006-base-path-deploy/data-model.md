# Data Model: Base Path Deploy (Subdirectory Hosting)

**Feature**: 006-base-path-deploy

This feature has no content data model — it does not touch `specs-input/`, `site-content.json`, or `CVEntry`. Its "entities" are configuration and deployment artifacts.

## BasePathConfig

| Field | Type | Source | Description |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_BASE_PATH` | string | `.env.production` (new file, committed) | The URL path prefix the whole site is served under (`/cv`). Loaded by Next.js automatically for `next build`/`next start`; absent during `next dev`. |

Consumers:

| Consumer | How it reads the value | Effect |
| --- | --- | --- |
| `next.config.mjs` | `process.env.NEXT_PUBLIC_BASE_PATH` → `basePath` config key | Prefixes every framework-emitted URL: `next/link` hrefs, `redirect()` targets, `_next/*` asset URLs, `usePathname()` strips it back off. |
| `components/Menu.tsx` (client component) | `process.env.NEXT_PUBLIC_BASE_PATH` (inlined at build time, `NEXT_PUBLIC_*` convention) | Prefixes the four raw `<a href download>` links (desktop/mobile × PDF/Word), which `basePath` does not reach (see [research R4](research.md#r4-raw-anchors-require-explicit-prefixing-fr-003)). |

## RootRedirectFile

| Field | Value |
| --- | --- |
| Repository path | `deploy/root.htaccess` (new, version-controlled) |
| Server path | Domain document root `.htaccess` (**not** `/cv/.htaccess`) |
| Managed by | Nobody automated — placed and updated manually. Explicitly outside `out/` and outside the FTP deploy tool's remote directory ([FR-010](spec.md), [FR-014 in 003](../003-ftp-deploy/spec.md)). |
| Content contract | See [contracts/root-htaccess.md](contracts/root-htaccess.md) |

## DeployRemoteDirectory

| Field | Value |
| --- | --- |
| Environment variable | `FTP_REMOTE_DIR` (existing, [003 FR-002](../003-ftp-deploy/spec.md)) |
| Value for this site | `/malte.sarner.se/public_html/cv` — a filesystem path on the FTP server, not the site's URL path; see [research R7](research.md#r7-ftp_remote_dir-is-a-filesystem-path-not-the-sites-url-path) |
| Consumers (unchanged code) | `uploadSite()`, `cleanupOldPdfs()`, `cleanupOldDocx()` in `tools/deploy-ftp.ts` — already parameterized on this value ([research R6](research.md#r6-deploy-tool-changes-required)) |

## Relationships

```
.env.production (NEXT_PUBLIC_BASE_PATH=/cv)
        │
        ├──▶ next.config.mjs (basePath)  ──▶  next build  ──▶  out/  (URLs inside HTML/JS prefixed with /cv)
        │
        └──▶ components/Menu.tsx (4 raw <a href> download links, prefixed manually)

.env.local (FTP_REMOTE_DIR=/malte.sarner.se/public_html/cv)
        │
        └──▶ tools/deploy-ftp.ts  ──▶  uploads out/ to /cv on the server, cleans stale PDFs/DOCX in /cv

deploy/root.htaccess  ──(manual upload, one time + on change)──▶  domain root .htaccess
        │
        └──▶ RedirectMatch 301 ^/$ /cv/   (bare domain → site)

public/.htaccess  ──(via out/, deployed automatically)──▶  /cv/.htaccess
        │
        └──▶ security headers, governs /cv/ subtree only (unchanged from feature 003)
```
