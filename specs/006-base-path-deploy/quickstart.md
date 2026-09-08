# Quickstart: Base Path Deploy (Subdirectory Hosting)

**Feature**: 006-base-path-deploy

## Prerequisites

- `.env.production` exists at the repo root with `NEXT_PUBLIC_BASE_PATH=/cv` (see [data-model.md](data-model.md))
- `.env.local` has `FTP_REMOTE_DIR` set to the filesystem path the FTP server resolves to Apache's
  `/cv` document root — **not necessarily the literal string `/cv`** (see
  [research R7](research.md#r7-ftp_remote_dir-is-a-filesystem-path-not-the-sites-url-path)). On this
  account that value is `/malte.sarner.se/public_html/cv`.
- `deploy/root.htaccess` exists (see [contracts/root-htaccess.md](contracts/root-htaccess.md))

## 1. Build and verify the base path locally

```bash
npm run export   # content:build && next build
```

Verify no framework-emitted URL is missing the prefix, and none has it duplicated:

```bash
# Expect zero matches — every asset reference should read "/cv/_next/..."
grep -r '"/_next/' out/ | grep -v '"/cv/_next/'

# Expect zero matches — download links should read "/cv/cv-..."
grep -rE '"/cv-(en|sv)-' out/ | grep -v '"/cv/cv-'

# Expect zero matches — the prefix must never be applied twice
grep -r '"/cv/cv/' out/

# Expect the only hit to be the process.env reference, not a bare literal
grep -n '"/cv"' next.config.mjs components/Menu.tsx
```

Corresponds to [SC-004](spec.md) and [FR-004](spec.md).

## 2. Confirm dev is unaffected

```bash
npm run dev
```

Open `http://localhost:3000/` — it should redirect to `/en/` as before, **not** `/cv/en/`. `next dev` does not load `.env.production`, so local development stays unprefixed (see [research R2](research.md#r2-where-the-base-path-value-lives-single-source-of-truth-fr-004)).

## 3. Serve the export locally under `/cv` and click through

Any static file server that lets you mount `out/` at a `/cv` prefix works, e.g.:

```bash
mkdir -p /tmp/site-root/cv
cp -r out/* /tmp/site-root/cv/
npx serve /tmp/site-root
```

Then, with the server's port substituted:

1. Open `/cv/` → redirects to `/cv/en/`, page renders styled. ([US1](spec.md), scenario 1)
2. Click Technologies → URL becomes `/cv/en/technologies`, page renders, Technologies link shown active. (scenario 2)
3. Switch language → URL becomes `/cv/sv/`, Swedish content shown. (scenario 3)
4. Open the download dropdown, click PDF → file downloads, no 404. Repeat on `/cv/sv/` → Swedish PDF downloads. (scenario 4)
5. Click Word → file downloads, no 404. Repeat on `/cv/sv/` → Swedish DOCX downloads. (scenario 5)
6. Open `/cv/en/does-not-exist` → not-found page renders; its home link points under `/cv/`. (scenario 6)
7. Open `/cv/contact` and `/cv/technologies` directly (no language prefix) → each redirects to its `/cv/en/...` equivalent. (scenario 7)
8. On `/cv/sv/`, click Technologies then Contact → URLs become `/cv/sv/technologies` and `/cv/sv/contact`, each with the correct link shown active. (scenario 8)

## 4. Deploy

```bash
npm run deploy:full
```

Verify:

- Files appear under `/cv` on the server, not the domain root ([FR-011](spec.md)).
- Any stale `cv-*.pdf` / `cv-*.docx` in `/cv` on the server are removed ([FR-012](spec.md)).
- Nothing at the domain root changes as a result of this command ([SC-005](spec.md)) — `deploy/root.htaccess` is not part of this step; see step 5.

## 5. Place the root redirect (one-time, manual)

Upload `deploy/root.htaccess` to the domain's document root as `.htaccess`, **alongside** the `/cv/` subdirectory, not inside it.

```bash
curl -sI https://malte.sarner.se/      # expect: 301, location: /cv/
curl -sI https://malte.sarner.se/cv/   # expect: 200, no further redirect
```

Corresponds to [SC-002](spec.md) and the verification commands in [contracts/root-htaccess.md](contracts/root-htaccess.md).

## 6. Migrate old root content (one-time, manual)

Per [FR-013](spec.md), this is out of scope for tooling. Move or remove the files currently at the domain root (`index.html`, `en/`, `sv/`, `_next/`, old `cv-*.pdf`/`.docx`) once step 5 is verified working, using your FTP client of choice.
