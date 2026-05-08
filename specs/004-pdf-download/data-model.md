# Data Model: PDF Download

**Feature**: 004-pdf-download
**Date**: 2026-05-08

## Entities

### PDF File

A generated static PDF document containing the full CV for one language.

| Field    | Type   | Source                                        | Description                                       |
| -------- | ------ | --------------------------------------------- | ------------------------------------------------- |
| filename | string | Derived: `cv-{lang}-{date}.pdf`               | Output filename with language code and build date |
| lang     | string | Iterated from `["en", "sv"]`                  | Language code                                     |
| date     | string | Read from `site-content.json` → `ui.pdf.date` | Build date for filename (YYYY-MM-DD)              |
| path     | string | `public/{filename}`                           | Output path relative to project root              |

**Validation rules**:

- `lang` must be one of the supported languages (`en`, `sv`)
- `date` must be a valid ISO date string (YYYY-MM-DD)
- Output directory (`public/`) must exist

### Site Content (input — read only)

The existing `public/content/site-content.json` serves as input. Relevant fields consumed by `build-pdf.ts`:

| Field              | Type                       | Usage in PDF                                 |
| ------------------ | -------------------------- | -------------------------------------------- |
| `person.name`      | string                     | Header / title of the PDF                    |
| `person.role`      | string                     | Subtitle under the name                      |
| `cv.summary`       | LocalizedText              | Summary paragraph at the top                 |
| `cv.education[]`   | CVEntry[]                  | Education section entries                    |
| `cv.roles[]`       | CVEntry[]                  | Positions section entries (fully expanded)   |
| `cv.assignments[]` | CVEntry[]                  | Assignments section entries (fully expanded) |
| `technologies`     | Record<string, TechItem[]> | Technologies by category (compact text)      |

### UI String Addition

New localized label and date field added to `site-content.json` via `build-content.ts`:

| Field         | Type          | Value (en)     | Value (sv)      |
| ------------- | ------------- | -------------- | --------------- |
| `ui.nav.pdf`  | LocalizedText | "Download PDF" | "Ladda ner PDF" |
| `ui.pdf.date` | string        | "2026-05-08"   | "2026-05-08"    |

### Navigation Link (runtime)

The download link rendered in `Menu.tsx`.

| Field    | Type   | Source                         | Description                           |
| -------- | ------ | ------------------------------ | ------------------------------------- |
| href     | string | `/cv-{lang}-{ui.pdf.date}.pdf` | Path to the PDF file for current lang |
| label    | string | `ui.nav.pdf[lang]`             | Localized link text                   |
| download | attr   | Present (boolean attribute)    | Triggers browser download behavior    |

## State Transitions

### PDF Build Process

```
[start] → read site-content.json → [content loaded]
                                  → [file missing/malformed] → EXIT(1)

[content loaded] → delete old cv-*.pdf from public/ → [cleaned]

[cleaned] → launch Puppeteer browser → [browser ready]
                                      → [launch failed] → EXIT(1)

[browser ready] → for each lang:
                    → render HTML template → set page content → wait for fonts
                    → generate PDF → write to public/ → [pdf written]
                    → [render error] → close browser → EXIT(1)

[all pdfs written] → close browser → [done] → EXIT(0)
```

### FTP Cleanup Process

```
[upload complete] → list remote cv-*.pdf files → [file list]

[file list] → identify files NOT matching current build → [stale list]

[stale list] → delete each stale file → [cleanup done]
            → [no stale files] → [cleanup done]

[cleanup done] → continue to summary
```

## Relationships

- Site Content JSON is the single input to PDF generation (read-only)
- PDF Files are output artifacts placed in `public/` for inclusion in static export
- Navigation Link references PDF Files by constructed filename
- FTP Cleanup depends on knowing the current build's PDF filenames
- `build-content.ts` provides the `ui.nav.pdf` label used by `Menu.tsx`
