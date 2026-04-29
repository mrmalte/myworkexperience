# CLI Contract: FTP Deploy

**Feature**: 003-ftp-deploy

## Commands

### `npm run deploy`

Uploads the contents of the `out/` build output directory to the configured FTP server.

**Prerequisites**: `out/` directory exists and is non-empty (run `npm run export` first).

**Environment variables** (loaded from `.env.local`):

| Variable         | Required | Default | Description           |
| ---------------- | -------- | ------- | --------------------- |
| `FTP_HOST`       | Yes      | —       | FTP server hostname   |
| `FTP_USER`       | Yes      | —       | FTP username          |
| `FTP_PASS`       | Yes      | —       | FTP password          |
| `FTP_REMOTE_DIR` | No       | `/`     | Remote directory path |

**Exit codes**:

| Code | Meaning                                       |
| ---- | --------------------------------------------- |
| 0    | Deploy completed successfully                 |
| 1    | Missing env vars, missing build, or FTP error |

**stdout output**:

```
=== FTP Deploy ===

Connected to {host} via FTPS (TLS)
Build output found: {path}/out

Uploading {path}/out → {remoteDir}
  Uploading: {filename}
  ...

✓ Deploy complete!
  Files uploaded: {count}
  Duration: {seconds}s
  Remote directory: {remoteDir}
```

---

### `npm run deploy:full`

Runs `npm run export` (build) followed by `npm run deploy`. Stops if build fails.

**Prerequisites**: Same env vars as `deploy`. No prior build needed.

**Exit codes**: Same as `deploy`, plus build failures propagate.

---

## Static Configuration

### `public/.htaccess`

Apache 2.4 configuration file deployed alongside the static site. Copied to `out/.htaccess` by Next.js build.

**Headers set**:

| Header                    | Value Summary                          |
| ------------------------- | -------------------------------------- |
| X-Frame-Options           | `DENY`                                 |
| X-Content-Type-Options    | `nosniff`                              |
| Strict-Transport-Security | 1 year, includeSubDomains              |
| Referrer-Policy           | `strict-origin-when-cross-origin`      |
| Permissions-Policy        | All device APIs disabled               |
| Content-Security-Policy   | Allows self, Google Fonts, EmailJS API |

**Graceful degradation**: All directives wrapped in `<IfModule mod_headers.c>`.
