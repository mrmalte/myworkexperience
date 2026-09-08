# Research: Base Path Deploy (Subdirectory Hosting)

**Feature**: 006-base-path-deploy

## R1: Mechanism for applying the base path

**Decision**: Use Next.js's built-in `basePath` config option in `next.config.mjs`, sourced from a `NEXT_PUBLIC_BASE_PATH` environment variable rather than a hardcoded string.

**Rationale**: `output: "export"` with `basePath` set does **not** change the physical layout of `out/` — `out/en/index.html` still lands at that same relative path. What changes is every URL the framework *emits into* the HTML/JS: `next/link` hrefs, `next/navigation` `redirect()` targets, and `_next/*` asset URLs all get the prefix baked in at build time. Uploading `out/` to `/cv` on the server then makes those emitted URLs correct, because the physical nesting (`/cv/` on the server) and the emitted prefix (`/cv` in the HTML) now agree. This is the standard, framework-supported way to serve a Next static export from a subdirectory; it requires no custom middleware and no server-side rewriting logic (which a static export cannot use).

**Alternatives considered**:

- **Apache alias/rewrite mapping `/cv/*` to the site root**: Rejected per the spec's clarification — the exported HTML contains root-absolute asset URLs (`/_next/static/...`). An Apache-side alias only changes which files answer a request path; it cannot rewrite the *contents* of the already-built HTML. Every asset reference would still 404 because the browser requests `/_next/...`, not `/cv/_next/...`.
- **Post-build search-and-replace over `out/`**: Rejected — fragile (would need to touch every HTML/JS file and stay in sync with Next.js's internal URL formats across upgrades) when `basePath` does the same job as a first-class, tested framework feature.

## R2: Where the base path value lives (single source of truth, FR-004)

**Decision**: Define `NEXT_PUBLIC_BASE_PATH=/cv` in a new `.env.production` file at the repo root. `next.config.mjs` reads `process.env.NEXT_PUBLIC_BASE_PATH` for the `basePath` option; the four raw download anchors in `components/Menu.tsx` read the same variable at render time to prefix their `href`.

**Rationale**: Next.js has two relevant built-in behaviors that make this the natural "single place" (FR-004) without inventing new plumbing:

1. Next.js automatically loads `.env.production` for `next build`/`next start`, and `.env.local`/`.env.development` for `next dev` — it does **not** load `.env.production` during `next dev`. This means local development continues to serve from `/` unprefixed with zero extra configuration, while `next build` (used by `npm run export`) picks up the base path automatically. No conditional logic is needed to keep dev and production apart.
2. Variables prefixed `NEXT_PUBLIC_` are inlined into client-bundle JavaScript at build time, exactly like the existing `NEXT_PUBLIC_EMAILJS_*` variables already used in this project for `ContactForm.tsx`. `Menu.tsx` is already a client component (`"use client"`), so reading `process.env.NEXT_PUBLIC_BASE_PATH` there requires no provider, context, or prop drilling.

`.env.production` contains no secret — it is not matched by the repo's `.env*.local` gitignore rule — so it is committed, satisfying FR-009's spirit of the value being discoverable in the repository even though this specific file is `.env.local`'s production counterpart rather than the FTP-credentials file itself.

**Alternatives considered**:

- **A shared TypeScript constant module (e.g. `lib/basePath.ts`)**: Rejected. `next.config.mjs` is loaded directly by the Next.js CLI before any TypeScript transpilation is available to it, so it cannot import a `.ts` module without extra tooling (`next.config.ts` is supported by Next 15, but renaming the existing config file is an unrelated change this feature doesn't need to make). An env var crosses both the config file and the React component cleanly with a mechanism the project already relies on.
- **Hardcoding `/cv` as a literal in `next.config.mjs` and in `Menu.tsx`**: Rejected directly by FR-004 — two literals is exactly the duplication the requirement forbids, and it would force `npm run dev` to also run under `/cv`.

## R3: Behavior of `usePathname()`, `next/link`, and `redirect()` under `basePath`

**Decision**: No code changes are needed in the active-page comparison in `Menu.tsx`, in the language-switch path logic, in `app/not-found.tsx`'s `Link`, or in the three redirect stub pages (`app/page.tsx`, `app/contact/page.tsx`, `app/technologies/page.tsx`).

**Rationale**: This is standard, documented Next.js `basePath` behavior, not project-specific code:

- `usePathname()` returns the pathname **with the base path already stripped**, so `pathname.includes("/technologies")` and the `^\/${lang}(\/|$)` regex in `Menu.tsx` keep working unchanged (confirms [006 FR-005](spec.md)).
- `next/link`'s `href` prop is basePath-aware and automatically prepends it, so `app/not-found.tsx`'s `<Link href="/en/">` resolves to `/cv/en/` with no change.
- `redirect()` from `next/navigation` is likewise basePath-aware for both client and server components, so `redirect("/en/")`, `redirect("/en/contact")`, and `redirect("/en/technologies")` resolve to `/cv/en/`, `/cv/en/contact`, `/cv/en/technologies` with no change to those three files.

**Alternatives considered**: None — this is existing framework behavior to verify, not a design choice.

## R4: Raw anchors require explicit prefixing (FR-003)

**Decision**: The four `<a href={...} download>` elements in `Menu.tsx` (desktop PDF, desktop Word, mobile PDF, mobile Word) are updated to read the base path from `process.env.NEXT_PUBLIC_BASE_PATH` (see R2) and prepend it to the existing `` `/cv-${lang}-${pdfDate}.pdf` `` / `.docx` template strings.

**Rationale**: [004 FR-013](../004-pdf-download/spec.md) and [005 FR-013](../005-docx-download/spec.md) require these to be standard anchor elements with a `download` attribute rather than `next/link`, specifically so the browser treats them as a real navigation/download rather than client-side routing. `basePath` only instruments framework-managed URL emission (`next/link`, `next/navigation`, asset injection) — it has no way to instrument a raw string interpolated into a JSX `href` attribute. Without the explicit prefix, these four links would be the only broken thing on an otherwise fully working site, which is a difficult class of bug to catch by casual browsing (everything *looks* fine until you click Download).

**Alternatives considered**:

- **Switch the download links to `next/link`**: Rejected — this would remove the `download` attribute's forced-download behavior semantics and contradicts FR-013 in both 004 and 005 directly. Out of scope for this feature to relitigate.

## R5: Root redirect directive and the loop hazard

**Decision**: `RedirectMatch 301 ^/$ /cv/`, placed in a new Apache config file version-controlled at `deploy/root.htaccess`, uploaded manually to the domain root (outside `out/`, outside the FTP deploy tool's managed directory).

**Rationale**: Apache's `Redirect` (and `RedirectMatch` without anchors) directive matches on a **path prefix**, not an exact path. `Redirect / /cv/` would match the request `/cv/` too (since `/cv/` starts with `/`), redirecting it to `/cv//cv/` — and every subsequent hop would append another `/cv` segment, looping forever. Anchoring the pattern with `^/$` makes it match only the exact root path, so it fires once and never matches its own target. This is the documented reason a full-domain redirect-to-subdirectory setup needs an anchored pattern rather than the simpler unanchored form.

The file cannot live in `public/` — that directory is copied into `out/` and deployed to `/cv/.htaccess`, governing the `/cv/` subtree (security headers, per [003 FR-011](../003-ftp-deploy/spec.md)). A directive placed there would never be read by requests to the bare domain, which are served from a different filesystem location on the host (the domain's actual document root, one level up from `/cv/`).

**Alternatives considered**:

- **`RewriteRule ^(.*)$ /cv/$1 [R=301,L]` with a `RewriteCond` excluding `/cv/`**: This is the "redirect the whole old tree" variant discussed and explicitly deferred in the spec's clarifications — it preserves old deep links (`/en/`, `/sv/technologies`) instead of letting them 404. Not chosen now because the migration is a one-time manual move and the maintainer accepted deep links 404ing; recorded in the spec as an option to add later if server logs show demand. The two directives can coexist without conflict since the `RewriteCond` exclusion prevents the same loop hazard.

## R6: Deploy tool changes required

**Decision**: None. `tools/deploy-ftp.ts` already parameterizes both the upload target and the stale-file cleanup (`cleanupOldPdfs`, `cleanupOldDocx`) on `cfg.remoteDir`, which is read from the `FTP_REMOTE_DIR` environment variable ([003 FR-002](../003-ftp-deploy/spec.md)). No code change is needed to point deployment at a different directory — only the *value* of `FTP_REMOTE_DIR` matters. (That value turned out not to be the literal string `/cv` — see [R7](#r7-ftp_remote_dir-is-a-filesystem-path-not-the-sites-url-path).)

**Rationale**: Verified by reading `tools/deploy-ftp.ts`: `uploadSite(client, cfg.remoteDir)`, `cleanupOldPdfs(client, cfg.remoteDir)`, and `cleanupOldDocx(client, cfg.remoteDir)` all take the configured remote directory as a parameter rather than assuming `/`. The feature that added stale-file cleanup already built it to work in whatever directory deployment targets.

**Alternatives considered**: None — this is a verification finding, not a design choice.

## R7: `FTP_REMOTE_DIR` is a filesystem path, not the site's URL path

**Decision**: `FTP_REMOTE_DIR` must be set to the absolute filesystem path, *as seen by the FTP session*, that Apache serves as `/cv` under the domain. On this hosting account (Loopia, `ftpcluster.loopia.se`) that path is `/malte.sarner.se/public_html/cv` — the FTP session's root is the shared hosting account root (with `gustaf.sarner.se`, `localears.com`, `malte.sarner.se`, `sarner.se` as sibling directories), not the domain's `public_html/`. The bare string `/cv` (what FR-011 originally specified, matching FR-002's *website* base path) is wrong for this host and silently uploads outside the served tree.

**Rationale**: The first production deploy (`npm run deploy:full`, 2026-08-18) completed with no errors — 98 files uploaded, stale-file cleanup ran, "Deploy complete" — but the live site kept showing pre-migration content (an `about/` directory absent from every build since the About page was removed, and PDF/DOCX files dated months earlier). The deploy had succeeded at creating and populating *some* `/cv` directory, just not the one Apache serves. This was diagnosed by comparing FTP session home directories across protocols: a `curl --ftp-ssl` session using raw `-Q "PWD"` / `-Q "CWD /malte.sarner.se/public_html/cv"` / `-Q "PWD"` commands (mirroring exactly what `deploy-ftp.ts`'s FTPS connection does at the protocol level, without relying on any client's URL-to-path translation) confirmed the corrected path resolves; a bare `ls -a` on the FTPS session's root confirmed it is the shared account root, not a domain-scoped chroot.

Two settings share the name "`/cv`" in this project but live in entirely different namespaces:

- The website's **URL base path** ([FR-002](spec.md)) — `NEXT_PUBLIC_BASE_PATH=/cv` — controls what Next.js emits into HTML/JS. Verified correct independently (20/20 Puppeteer checks against a locally-served export). Unaffected by this finding.
- The deploy's **FTP remote directory** ([FR-011](spec.md)) — `FTP_REMOTE_DIR` — controls where `basic-ftp` uploads files on the *server's filesystem*, in a namespace defined by the FTP server/hosting account, which has no required relationship to the URL path string at all. They coincide only when the FTP session's root happens to already be the domain's document root — true on some hosts, false on this one.

**Alternatives considered**:

- **Assume `FTP_REMOTE_DIR=/cv` is portable across hosts**: This was the original (wrong) assumption baked into FR-011 before the first real deploy. Rejected going forward — the spec now states the requirement in terms of what the path must *resolve to*, not a literal value, since the literal value is host-specific.
- **Have the deploy script auto-discover the correct path**: Not pursued. There's no reliable, protocol-level way to ask an FTP server "where does the web server serve `/cv` from" — the mapping is hosting-provider-specific configuration knowledge, not something discoverable via FTP commands. The `curl --ftp-ssl -Q "PWD"` diagnostic (documented in the README) is the repeatable way to verify it by hand when setting up a new host or account.
