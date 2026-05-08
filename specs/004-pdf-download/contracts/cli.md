# CLI Contract: PDF Build

**Feature**: 004-pdf-download

## Commands

### `npm run pdf:build`

Generates PDF versions of the CV for all supported languages.

**Prerequisites**: `public/content/site-content.json` must exist (run `npm run content:build` first).

**Exit codes**:

| Code | Meaning                                                        |
| ---- | -------------------------------------------------------------- |
| 0    | PDF files generated successfully                               |
| 1    | Missing/malformed site-content.json, or Puppeteer render error |

**stdout output**:

```
=== PDF Build ===

Reading site content...
Deleting old PDF files...
  Deleted: cv-en-2026-04-01.pdf
  Deleted: cv-sv-2026-04-01.pdf
Launching browser...
Generating cv-en-2026-05-08.pdf...
  ✓ cv-en-2026-05-08.pdf (X pages)
Generating cv-sv-2026-05-08.pdf...
  ✓ cv-sv-2026-05-08.pdf (X pages)
Closing browser...

✓ PDF build complete!
  Files generated: 2
  Output directory: public/
```

**Output files**:

| File                   | Location  | Description    |
| ---------------------- | --------- | -------------- |
| `cv-en-YYYY-MM-DD.pdf` | `public/` | English CV PDF |
| `cv-sv-YYYY-MM-DD.pdf` | `public/` | Swedish CV PDF |

---

### `npm run deploy:full` (updated)

Updated pipeline: `npm run content:build && npm run pdf:build && next build && npm run deploy`

**Build order**:

1. `content:build` — generates `site-content.json` (including `ui.pdf.date`)
2. `pdf:build` — reads `site-content.json`, generates PDFs to `public/`
3. `next build` — static export copies `public/` (including PDFs) to `out/`
4. `deploy` — uploads `out/` to server via FTP

**Note**: Since `next build` with `output: "export"` copies `public/` contents to `out/`, and `pdf:build` writes to `public/` before `next build`, the PDFs are included in the export automatically — no extra copy step needed.

---

## FTP Deploy Changes

### Server-side PDF Cleanup

After uploading all files, `deploy-ftp.ts` performs:

1. List all files matching `cv-*.pdf` in the remote directory
2. Identify files whose names don't match the current build's filenames
3. Delete stale files

**stdout additions**:

```
Cleaning up old PDF files...
  Deleted remote: cv-en-2026-04-01.pdf
  Deleted remote: cv-sv-2026-04-01.pdf
  Kept: cv-en-2026-05-08.pdf, cv-sv-2026-05-08.pdf
```

If no stale files exist:

```
Cleaning up old PDF files...
  No stale PDF files found.
```
