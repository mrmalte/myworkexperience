# Data Model: DOCX Download

## Entities

### DocxFile (generated output)

| Field    | Type         | Description                                        |
| -------- | ------------ | -------------------------------------------------- |
| filename | string       | `cv-{lang}-{YYYY-MM-DD}[-nolatestrole].docx`       |
| lang     | "en" \| "sv" | Language code                                      |
| date     | string       | Build date from `ui.pdf.date` in site-content.json |
| location | path         | `public/{filename}` (included in static export)    |

### Content Labels (additions to UIStrings.nav)

| Field          | Type          | Default (en) | Default (sv) |
| -------------- | ------------- | ------------ | ------------ |
| `nav.download` | LocalizedText | "Download"   | "Ladda ned"  |
| `nav.word`     | LocalizedText | "Word"       | "Word"       |

### Existing entities consumed (no changes)

- **SiteContent**: Read from `public/content/site-content.json` — same interface as used by `build-pdf.ts`
- **CVEntry**: Education, roles, and assignments with `title`, `description`, `technologies`, `period`
- **TechItem**: `{ name: string; years: number }` grouped by category
- **LocalizedText**: `{ en: string; sv: string }`

## Document Structure (DOCX internal)

```
Document
└── Section (single)
    ├── Paragraph [Heading1, Cambria]: person.name
    ├── Paragraph [Normal, Calibri, bold, uppercase]: person.role
    ├── Paragraph [Normal, Calibri]: cv.summary[lang] (one paragraph per text block)
    ├── Paragraph [Heading2, Cambria]: sections.education[lang]
    ├── [For each education entry]:
    │   ├── Paragraph [Normal, Calibri, bold]: organization + " — " + period
    │   ├── Paragraph [Normal, Calibri, italic]: title[lang]
    │   └── Paragraph [Normal, Calibri]: description[lang]
    ├── Paragraph [Heading2, Cambria]: sections.roles[lang]
    ├── [For each role entry (skip latest if --skip-latest-role)]:
    │   ├── Paragraph [Normal, Calibri, bold]: organization + " — " + period
    │   ├── Paragraph [Normal, Calibri, italic]: title[lang]
    │   └── Paragraph [Normal, Calibri]: description[lang]
    ├── Paragraph [Heading2, Cambria]: sections.assignments[lang]
    ├── [For each assignment entry]:
    │   ├── Paragraph [Normal, Calibri, bold]: organization — client + " — " + period
    │   ├── Paragraph [Normal, Calibri, italic]: title[lang]
    │   ├── Paragraph [Normal, Calibri]: description[lang]
    │   └── Paragraph [Normal, Calibri] (if technologies.length > 0): "Technologies: tech1, tech2, ..."
    ├── Paragraph [Heading2, Cambria]: "Technologies" / "Teknologier"
    └── [For each category]:
        └── Paragraph [Normal, Calibri]: "Category: tech1, tech2, ..."
```

## State Transitions

### Download Dropdown (Menu.tsx)

```
States: CLOSED, OPEN

CLOSED → OPEN:  user clicks Download button
OPEN → CLOSED:  user clicks outside | user clicks a download link | route changes
```

## Validation Rules

- `ui.pdf.date` must exist in site-content.json (build fails with error if missing)
- `site-content.json` must be valid JSON and parseable as SiteContent (build fails with clear error)
- Generated DOCX filenames must match pattern: `cv-(en|sv)-\d{4}-\d{2}-\d{2}(-nolatestrole)?\.docx`

## Relationships

```
specs-input/cv/* → [content:build] → site-content.json → [docx:build] → cv-*.docx → [next build] → out/cv-*.docx
                                                        → [pdf:build]  → cv-*.pdf
                                    site-content.json → Menu.tsx (reads nav labels + date for hrefs)
```
