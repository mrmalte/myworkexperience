# Quickstart: PDF Download

**Feature**: 004-pdf-download

## Prerequisites

- Node.js installed (same version as main project)
- Internet access (for Google Fonts loading during PDF generation)
- Site content built (`public/content/site-content.json` must exist)

## Setup

### 1. Install dependencies

```bash
npm install --save-dev puppeteer
```

### 2. Build site content (if not already done)

```bash
npm run content:build
```

### 3. Generate PDFs

```bash
npm run pdf:build
```

This creates `cv-en-YYYY-MM-DD.pdf` and `cv-sv-YYYY-MM-DD.pdf` in `public/`.

### 4. Verify

Open the generated PDFs and confirm:

- All CV sections are present (summary, education, positions, assignments, technologies)
- Headings use Fraunces (serif) font
- Body text uses Instrument Sans (sans-serif) font
- Colors match the website (accent green `#1a6b4a`, dark text `#1a1816`)
- A4 page size with comfortable margins

## Development Workflow

### Build and preview PDFs only

```bash
npm run pdf:build
open public/cv-en-*.pdf
```

### Full build with PDFs

```bash
npm run content:build && npm run pdf:build && next build
```

Note: `content:build` must run first (writes `ui.pdf.date`), then `pdf:build` (reads the date, generates PDFs to `public/`), then `next build` (includes PDFs in static export).

### Full deploy (includes PDF generation)

```bash
npm run deploy:full
```

## Navigation Link

After running `npm run content:build` (which now includes the `ui.nav.pdf` label), the PDF download link appears in the website navigation:

- Desktop: after the Contact link
- Mobile: in the hamburger drawer after Contact

The link uses `<a download>` and points to `/cv-{lang}-{date}.pdf` where the date is read from `ui.pdf.date` in site-content.json (written during `content:build`).

## Troubleshooting

| Problem                                         | Solution                                                                       |
| ----------------------------------------------- | ------------------------------------------------------------------------------ |
| "site-content.json not found"                   | Run `npm run content:build` first                                              |
| Puppeteer launch error                          | Ensure Chromium can run: check `npx puppeteer browsers install chrome`         |
| Fonts don't render in PDF                       | Check internet access; Google Fonts must be reachable during build             |
| PDF download link shows 404 in dev              | Run `npm run pdf:build` to generate the PDFs locally                           |
| Date mismatch between PDF filename and nav link | Re-run `npm run content:build` — both PDF and nav link read from `ui.pdf.date` |
| Old PDFs still on server after deploy           | Verify `deploy-ftp.ts` cleanup logic; check FTP list/delete permissions        |
