# Contract: Domain Root `.htaccess`

**Feature**: 006-base-path-deploy
**Repository path**: `deploy/root.htaccess`
**Deployed path**: the domain's document root `.htaccess` — a sibling of the `/cv/` subdirectory, **not** inside it

## Required content

```apache
# Root redirect: send the bare domain to the CV subdirectory.
# Anchored to the exact root path only — an unanchored `Redirect / /cv/`
# would also match `/cv/` itself and loop forever (/cv/ -> /cv//cv/ -> ...).
RedirectMatch 301 ^/$ /cv/
```

## Requirements this satisfies

- [FR-007](../spec.md): domain root issues a permanent redirect to the base path.
- [FR-008](../spec.md): the match is anchored to the exact root, not a prefix, to avoid the redirect-loop hazard documented in [research R5](../research.md#r5-root-redirect-directive-and-the-loop-hazard).
- [FR-009](../spec.md): version-controlled in the repository.
- [FR-010](../spec.md): explicitly not part of `out/` and not touched by `tools/deploy-ftp.ts` or any npm script — placement on the server is a manual step.

## Verification

```bash
curl -sI https://malte.sarner.se/          # expect: HTTP/2 301, location: /cv/
curl -sI https://malte.sarner.se/cv/       # expect: HTTP/2 200, no further redirect
```

Both correspond directly to [SC-002](../spec.md).

## Explicitly not covered by this file

- Security response headers (`X-Frame-Options`, CSP, etc.) — those remain in `public/.htaccess`, deployed automatically as `/cv/.htaccess`, and govern the `/cv/` subtree only. This root file governs the domain root exclusively and carries no header configuration.
- Redirecting old deep links (`/en/`, `/sv/technologies`) from the pre-migration layout. Deferred per the spec's clarifications; if added later it takes the form of a `RewriteRule` with a `RewriteCond` excluding `/cv/`, coexisting with the directive above.
