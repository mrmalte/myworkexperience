# CLI Contract: `npm run docx:build`

## Command

```bash
npm run docx:build [-- --skip-latest-role]
```

Resolves to: `tsx tools/build-docx.ts [--skip-latest-role]`

## Inputs

| Input                     | Source                             | Required |
| ------------------------- | ---------------------------------- | -------- |
| site-content.json         | `public/content/site-content.json` | Yes      |
| `--skip-latest-role` flag | CLI argument                       | No       |

## Outputs

### Success (exit code 0)

Files written to `public/`:

- `cv-en-{date}.docx` (or `cv-en-{date}-nolatestrole.docx` with flag)
- `cv-sv-{date}.docx` (or `cv-sv-{date}-nolatestrole.docx` with flag)

Where `{date}` = value of `ui.pdf.date` from site-content.json.

**stdout** (informational):

```
=== DOCX Build ===

Reading site content...
Deleting old DOCX files...
  Deleted: cv-en-2026-04-01.docx
  Deleted: cv-sv-2026-04-01.docx
Generating cv-en-2026-06-01.docx...
  ✓ cv-en-2026-06-01.docx
Generating cv-sv-2026-06-01.docx...
  ✓ cv-sv-2026-06-01.docx

✓ DOCX build complete!
  Files generated: 2
  Output directory: public/
```

### Failure (exit code 1)

| Condition                            | stderr message                                      |
| ------------------------------------ | --------------------------------------------------- |
| site-content.json missing/unreadable | `Error: Could not read {path}`                      |
| `ui.pdf.date` missing                | `Error: ui.pdf.date not found in site-content.json` |

## Side Effects

- Deletes all existing `cv-*.docx` files from `public/` before generating new ones (FR-004).

## Preconditions

- `npm run content:build` must have been run first (produces site-content.json with `ui.pdf.date`).
- `docx` package must be installed (`npm install`).

---

# CLI Contract: `npm run deploy:full` (updated)

## Command

```bash
npm run deploy:full
```

Resolves to: `npm run content:build && npm run pdf:build && npm run docx:build && next build && npm run deploy`

## Pipeline Order

1. `content:build` — generates site-content.json
2. `pdf:build` — generates cv-\*.pdf
3. `docx:build` — generates cv-\*.docx
4. `next build` — static export to `out/`
5. `deploy` — FTP upload + cleanup

## Deploy Cleanup (extended)

The deploy step removes stale files from the remote server matching:

- `cv-*.pdf` (existing behavior)
- `cv-*.docx` (new behavior)

Only files from the current build are kept.

---

# UI Contract: Download Dropdown (Menu.tsx)

## Props additions

```typescript
interface MenuProps {
  navLabels: {
    // existing:
    cv: LocalizedText;
    technologies: LocalizedText;
    contact: LocalizedText;
    pdf: LocalizedText;
    // new:
    download: LocalizedText;
    word: LocalizedText;
  };
  pdfDate: string; // existing — reused for both PDF and DOCX hrefs
}
```

## Desktop Behavior

- Position: After the Contact nav link
- Trigger: Button labeled `navLabels.download[lang]`
- Dropdown content: Two `<a download>` links:
  - PDF: href=`/cv-{lang}-{pdfDate}.pdf`, label=`navLabels.pdf[lang]`
  - Word: href=`/cv-{lang}-{pdfDate}.docx`, label=`navLabels.word[lang]`
- Close triggers: click outside, route change

## Mobile Behavior (inside HamburgerDrawer)

- No sub-dropdown — render PDF and Word as separate nav-style links in the drawer list
- Same hrefs and labels as desktop
- Clicking either link closes the drawer
