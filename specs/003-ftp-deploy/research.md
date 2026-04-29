# Research: FTP Deploy

**Feature**: 003-ftp-deploy
**Date**: 2026-04-22

## 1. FTP Client Library

**Decision**: Use `basic-ftp` (v5.x)

**Rationale**: Modern async/await API with built-in TypeScript declarations, zero Node.js dependencies, and a `uploadFromDir()` method for recursive directory uploads. Actively maintained (latest release days ago). Supports FTPS (explicit TLS) via `secure: true` with Node.js TLS options. Provides progress tracking via `client.trackProgress(handler)` and verbose logging. Errors split into `FTPError` (recoverable, connection open) and connection errors (require reconnect).

**Alternatives considered**:

- `node-ftp`: Callback-based, last published 11+ years ago, no built-in recursive upload — rejected for age and API style
- Manual `net`/`tls` sockets: Reinvents the wheel — rejected for unnecessary complexity

## 2. FTP Hosting

**Decision**: Use FTPS (explicit TLS on port 21) by default, fall back to plain FTP if TLS handshake fails.

**Rationale**: FTPS over TLS/SSL (explicit mode) is widely supported on shared hosting. Standard FTP port 21 with TLS handshake. The hostname is configured per account. The remote web root varies per account — commonly `/public_html` or root `/` — must be configurable via environment variable.

**Alternatives considered**:

- SFTP only: Not supported by all shared hosts — eliminated
- Plain FTP only: Functional but insecure — rejected in favor of FTPS with fallback

## 3. Environment Variable Loading

**Decision**: Use `dotenv` package with explicit path to `.env.local`.

**Rationale**: Zero dependencies, standard approach. Project already uses `.env.local` for EmailJS credentials (Next.js convention). The `tsx` runtime used for tools does not auto-load `.env` files, so `dotenv.config({ path: '.env.local' })` is needed at script entry. The project's existing tools (`build-content.ts`, `validate-content.ts`) don't currently load env files (they don't need them), so this is a new but consistent pattern.

**Alternatives considered**:

- `dotenv-cli`: Wraps the command in package.json — adds indirection for minimal benefit
- `dotenvx`: Next-generation successor, unnecessary complexity for this use case
- Manual file parsing: Reinvents the wheel — rejected

## 4. Upload Strategy

**Decision**: Full overwrite upload using `uploadFromDir()`.

**Rationale**: The static output directory (`out/`) is small (~200-500 files) and fully regenerated on each build. `basic-ftp`'s `uploadFromDir()` handles recursive creation of directories and overwriting of existing files. Incremental/differential upload adds significant complexity (tracking file hashes, handling deletions) for negligible time savings on this scale. A full upload keeps the deploy script simple and the remote always in sync with the build.

**Alternatives considered**:

- Incremental upload (compare file hashes/timestamps): Adds complexity, requires maintaining a manifest, error-prone for deletions — rejected for this project scale
- `rsync` over FTP: Not a real protocol combination; `rsync` requires SSH — not applicable

## 5. Required Environment Variables

**Decision**: Four environment variables:

| Variable         | Required | Description                             |
| ---------------- | -------- | --------------------------------------- |
| `FTP_HOST`       | Yes      | FTP server hostname                     |
| `FTP_USER`       | Yes      | FTP username                            |
| `FTP_PASS`       | Yes      | FTP password                            |
| `FTP_REMOTE_DIR` | No       | Remote directory path (defaults to `/`) |

**Rationale**: Minimal set that covers all connection parameters. Remote directory is optional with a sensible default. Naming uses `FTP_` prefix (not `NEXT_PUBLIC_`) because these are server credentials that must _not_ be exposed in the browser bundle.

## 6. Apache 2.4 Security Headers (.htaccess)

**Decision**: Use `mod_headers` in `.htaccess`, wrapped in `<IfModule mod_headers.c>` for graceful degradation. Set security headers: X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security, Content-Security-Policy, Referrer-Policy, and Permissions-Policy.

**Rationale**: `mod_headers` is a core Apache 2.4 module enabled by default on virtually all shared hosting. Wrapping in `<IfModule>` prevents 500 errors if the module is disabled. Next.js with `output: "export"` automatically copies files from `public/` to `out/`, so placing `.htaccess` in `public/` ensures it's deployed.

**Alternatives considered**:

- Setting headers via hosting control panel: Not possible for custom headers on most shared hosting
- Next.js `headers` config: Only works with the Next.js server, not static export

## 7. Content-Security-Policy Directives

**Decision**: Use the following CSP:

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data:;
connect-src 'self' https://api.emailjs.com;
object-src 'none';
base-uri 'self';
frame-src 'none';
frame-ancestors 'none';
upgrade-insecure-requests
```

**Rationale**:

- `script-src 'self'`: All scripts are bundled by Next.js. EmailJS is an npm dependency (`@emailjs/browser`) bundled at build time — no external CDN needed.
- `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`: Tailwind compiles to external CSS but React may inject inline style attributes. Google Fonts CSS is loaded from `fonts.googleapis.com` via `<link>` in the root layout.
- `font-src 'self' https://fonts.gstatic.com`: Google Fonts serves font files from `fonts.gstatic.com`.
- `connect-src 'self' https://api.emailjs.com`: EmailJS SDK makes runtime fetch calls to `api.emailjs.com` to send emails.
- `img-src 'self' data:`: Local images; `data:` for base64-encoded images.
- `object-src 'none'`: Blocks plugins.
- `base-uri 'self'`: Prevents `<base>` tag injection.
- `frame-src 'none'`: No iframes used.
- `frame-ancestors 'none'`: Prevents embedding (clickjacking defense, complements X-Frame-Options).
- `upgrade-insecure-requests`: Complements HSTS by upgrading HTTP to HTTPS.
- No `'unsafe-eval'` needed — Next.js export doesn't use eval().

**Alternatives considered**:

- Nonce-based CSP: Requires server-side per-request generation — not viable for static export
- Self-hosting Google Fonts: Would simplify CSP (remove external sources) but adds build complexity and font update burden
- `'strict-dynamic'`: Not needed since all scripts are bundled locally
