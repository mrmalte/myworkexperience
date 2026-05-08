# Research: PDF Download

**Feature**: 004-pdf-download
**Date**: 2026-05-08

## 1. PDF Generation Library

**Decision**: Use `puppeteer` (latest stable)

**Rationale**: Puppeteer provides a full headless Chromium browser that renders HTML/CSS faithfully, including Google Fonts loaded via `@import` or `<link>`. Its `page.pdf()` API directly produces PDF with fine-grained control over page size, margins, and print media queries. Since the project already uses a build-time approach (TypeScript tools via `tsx`), Puppeteer fits naturally as a devDependency. The generated PDF will match the website's visual identity because it renders real CSS — no need to translate styles to a PDF-specific format.

**Alternatives considered**:

- `pdf-lib`: Low-level PDF manipulation; requires manual layout of text, fonts, and positioning — far too much work to replicate a styled page
- `@react-pdf/renderer`: React-based PDF but uses its own layout engine, not CSS — would require duplicating all styling in a different format
- `weasyprint` (Python): Non-Node.js dependency, doesn't fit TypeScript tooling constraint
- `playwright`: Similar capability but heavier install; Puppeteer is sufficient and more focused

## 2. Puppeteer PDF Approach

**Decision**: Render an in-memory HTML string via `page.setContent()`, then call `page.pdf()`.

**Rationale**: The PDF content is a self-contained HTML document generated from `site-content.json`. There's no need to spin up a local dev server or navigate to a URL. Using `setContent()` is simpler, faster, and avoids port conflicts. The HTML template includes inline `<style>` with Google Fonts `@import` and all necessary CSS. `waitUntil: 'networkidle0'` ensures fonts are loaded before PDF generation.

**Alternatives considered**:

- Start a local Next.js dev server and navigate Puppeteer to it: Adds complexity (port management, waiting for server startup, dealing with client-side hydration/interactivity); the PDF needs a simplified layout without interactive elements anyway
- Use a dedicated `/pdf` route in Next.js: Would require maintaining a separate page component and dealing with static export limitations — unnecessary complexity

## 3. Font Loading in Puppeteer

**Decision**: Use Google Fonts `@import` in the HTML template's `<style>` block with `waitUntil: 'networkidle0'`.

**Rationale**: Google Fonts CDN is reliable and fast. The `networkidle0` wait condition ensures all font files are downloaded before PDF rendering begins. The two fonts needed are Fraunces (serif, for headings) and Instrument Sans (sans-serif, for body text) — both available on Google Fonts. No local font installation required.

**Alternatives considered**:

- Bundle font files locally: Adds complexity and file size to the repo; Google Fonts are accessible in any build environment with internet access
- Use system fonts as fallback: Would not match the website's visual identity — rejected per FR-007

## 4. PDF Page Layout

**Decision**: A4 page size with 20mm margins on all sides. Content flows naturally with CSS page-break rules.

**Rationale**: A4 (210mm × 297mm) is the standard paper size for CVs in Europe (where the site owner is based). 20mm margins provide comfortable reading space and printer compatibility. CSS `page-break-inside: avoid` on section headings and entry blocks prevents awkward splits.

**Alternatives considered**:

- Letter size: Standard in US but not in target market
- Narrow margins (10mm): Too tight for professional documents; risks content being cut by printers

## 5. Technologies Section Layout in PDF

**Decision**: Compact text format grouped by category: `Category: tech1, tech2, tech3`

**Rationale**: The website uses interactive bar charts for technologies, which don't translate to print. A compact text list grouped by category provides all the information in a space-efficient format suitable for print/PDF. This matches FR-005 requirement.

**Alternatives considered**:

- Recreate bar charts as SVG in PDF: Complex, fragile, and wastes vertical space in a print document
- Simple bullet list per technology: Takes too much vertical space with 50+ technologies

## 6. Old PDF Cleanup (Local)

**Decision**: `build-pdf.ts` deletes all files matching `cv-*.pdf` in `public/` before generating new ones.

**Rationale**: Since PDF filenames include the build date, old files from previous builds would accumulate. A simple glob delete before generation keeps `public/` clean. This is safe because PDF files are always regenerated — they are never hand-edited (per Constitution Principle III).

**Alternatives considered**:

- Keep old files and let git track them: Would bloat the repo with binary files that change daily
- Only delete if filename differs: Unnecessary complexity; always regenerating is simpler and deterministic

## 7. Old PDF Cleanup (Server)

**Decision**: `deploy-ftp.ts` lists remote files matching `cv-*.pdf` pattern after upload and deletes any that don't match the current build's filenames.

**Rationale**: The FTP upload (`uploadFromDir`) overwrites existing files but doesn't delete files that no longer exist locally. Since PDF filenames change with each build date, old PDFs would accumulate on the server. Adding a cleanup step after upload ensures only current PDFs remain (FR-017).

**Alternatives considered**:

- Clear entire remote directory before upload: Destructive and causes brief downtime; rejected
- Don't clean up (let old files accumulate): Violates FR-017 and wastes server space

## 8. Navigation Link Implementation

**Decision**: Use a plain `<a>` element with `download` attribute, not Next.js `<Link>`.

**Rationale**: The PDF download is a static file download, not a client-side navigation. Using a plain `<a href="/cv-en-2026-05-08.pdf" download>` triggers the browser's native download behavior (FR-013). Next.js `<Link>` would attempt client-side routing which is inappropriate for a binary file download. The `download` attribute also provides graceful fallback — browsers that don't support it will navigate to the PDF (which browsers can display natively).

**Alternatives considered**:

- Next.js `<Link>`: Would trigger client-side routing — incorrect for file downloads
- JavaScript-triggered download (blob): Unnecessary complexity for a static file

## 9. Date Derivation for Filename

**Decision**: `build-content.ts` writes `ui.pdf.date` (YYYY-MM-DD) into `site-content.json`. Both `build-pdf.ts` and `Menu.tsx` read the date from there.

**Rationale**: Menu.tsx is a `"use client"` component — using `new Date()` at render time would produce the visitor's local date, not the build date, causing the PDF link to 404 on any day after deploy. By writing the date once during `content:build`, both the PDF generator and the navigation component use the exact same value. The build order becomes: `content:build` → `pdf:build` → `next build`. Since PDFs are placed in `public/` before `next build`, they're included in the static export automatically — no post-export copy step needed.

**Alternatives considered**:

- Both derive from `new Date()` independently: Fails because Menu.tsx is a client component and would use the visitor's date, not the build date
- Write a separate manifest file: Unnecessary complexity when `site-content.json` already exists as the data coordination layer
- Pass the date as an environment variable: Possible but adds build configuration — `site-content.json` is simpler and already consumed by all components
