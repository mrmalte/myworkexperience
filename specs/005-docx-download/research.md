# Research: DOCX Download

## R1: `docx` npm package for programmatic Word document construction

**Decision**: Use the `docx` npm package (https://www.npmjs.com/package/docx)

**Rationale**: The `docx` package is a pure JavaScript/TypeScript library that creates .docx files programmatically without requiring Microsoft Word or any external binary. It has a declarative API (Document → Sections → Paragraphs) that maps cleanly to the document structure needed for a CV. It supports font specification, heading styles, paragraph formatting, and tables — all required for this feature. Zero native dependencies means it works reliably in any Node.js build environment.

**Alternatives considered**:

- `officegen`: Older, less maintained, imperative API, weaker TypeScript support.
- `html-docx-js` / `html-to-docx`: HTML-to-docx conversion approach — spec explicitly requires programmatic construction (FR-001), and HTML conversion produces less predictable styling.
- Pandoc (external binary): Adds system dependency, harder to control styling precisely, breaks the "all tooling in TypeScript" principle.

**Key API patterns**:

```typescript
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

const doc = new Document({
  sections: [
    {
      properties: {},
      children: [
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: "Name", font: "Cambria" })],
        }),
        new Paragraph({
          children: [new TextRun({ text: "Body text", font: "Calibri" })],
        }),
      ],
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
writeFileSync("output.docx", buffer);
```

## R2: Font choices — Calibri and Cambria

**Decision**: Use Calibri for body text, Cambria for headings.

**Rationale**: Both are Microsoft Office core fonts installed on virtually all Windows systems and included with Office on macOS. The `docx` package specifies fonts by name in the document XML — the rendering application (Word, LibreOffice, Google Docs) resolves them at open time. No font embedding is required. These fonts are also the historical defaults for Word documents (Calibri body, Cambria headings in the Office 2007+ default theme), so they feel natural and professional in a Word context.

**Alternatives considered**:

- Fraunces + Instrument Sans (matching website): Not universally installed, would require font embedding which increases file size and complexity.
- Arial + Times New Roman: Universal but dated appearance.
- System default (no explicit font): Unpredictable across platforms.

## R3: Document structure mapping

**Decision**: Document → single Section → flat list of Paragraphs (headings + body)

**Rationale**: The CV is a single continuous document. Using one Section keeps page numbering simple and avoids unwanted section breaks. Structure is:

1. Heading1: Person name
2. Normal paragraph: Role (styled bold/uppercase)
3. Normal paragraphs: Summary text
4. Heading2: "Education"
5. Entry paragraphs (org, period, title, description) for each education entry
6. Heading2: "Roles" / "Assignments"
7. Entry paragraphs for each (with technologies line for assignments)
8. Heading2: "Technologies"
9. Category paragraphs (category: tech1, tech2, ...)

**Alternatives considered**:

- Multiple sections (one per CV section): Unnecessary complexity, risks unwanted page breaks.
- Tables for entries: Adds complexity for period alignment; simple paragraphs with tab stops or inline text suffice for a CV.

## R4: Download dropdown UI implementation

**Decision**: Client-side `useState` for open/close state. Desktop renders as a positioned dropdown below the button. Mobile renders as inline links in the hamburger drawer.

**Rationale**: The dropdown is a simple open/close toggle — no third-party component library needed. React `useState` is sufficient. A `useEffect` with a click-outside handler closes the dropdown. On mobile (inside `HamburgerDrawer`), there's no need for a sub-dropdown — just render the PDF and Word links as separate items in the drawer nav list.

**Alternatives considered**:

- Headless UI / Radix dropdown: Overkill for a 2-item dropdown; adds bundle size.
- CSS-only hover dropdown: Doesn't work well on touch devices; less accessible.
- HTML `<details>`/`<summary>`: Styling is inconsistent cross-browser; harder to control positioning.

**Implementation pattern**:

```tsx
const [downloadOpen, setDownloadOpen] = useState(false);
// Desktop: button + absolutely positioned panel
// Mobile: two separate <a> links in drawer nav
// useEffect: click-outside closes dropdown
// useEffect or usePathname: route change closes dropdown
```

## R5: Content schema additions

**Decision**: Add `ui.nav.download` and `ui.nav.word` to the UIStrings interface in `build-content.ts`. Reuse existing `ui.nav.pdf`.

**Rationale**: Follows the established pattern — all UI strings are defined in `build-content.ts` with `LocalizedText` (en/sv). The Menu component receives them as props from a server component that reads site-content.json. Default values: `download` → "Download" / "Ladda ned", `word` → "Word" / "Word".

**Alternatives considered**:

- Hardcode labels in the component: Breaks the single-source content pattern used by the rest of the nav.
- Separate i18n file: Inconsistent with existing approach where all strings live in site-content.json.

## R6: Deploy cleanup extension

**Decision**: Extend the existing `cleanupOldPdfs` function in `deploy-ftp.ts` to also handle `.docx` files, or add a parallel `cleanupOldDocx` function following the same pattern.

**Rationale**: The existing cleanup logic is straightforward — list remote files matching `cv-*.pdf`, compare to local current build files, delete stale ones. The same pattern applies to `.docx`. Renaming the function to `cleanupOldFiles` and parameterizing by extension, or adding a second similar function, both work. A generalized approach (single function handling both extensions) is slightly cleaner.

**Alternatives considered**:

- Single glob `cv-*.*` for both: Could accidentally match unexpected files.
- Separate independent function: More code but clearer; acceptable given the simplicity.

## R7: build-docx.ts structure (mirroring build-pdf.ts)

**Decision**: Follow the same high-level structure as `build-pdf.ts`:

1. Define interfaces (reuse from existing types)
2. Read `site-content.json`
3. Validate `ui.pdf.date` exists
4. Delete old `cv-*.docx` files from `public/`
5. Loop over languages, build Document, write via `Packer.toBuffer()`
6. Support `--skip-latest-role` flag

**Rationale**: Consistency with the existing PDF tool makes the codebase easier to navigate and maintain. Both tools read the same data, produce similar output (one file per language), and support the same flag.

**Alternatives considered**:

- Shared module for common logic: The overlap is mostly structural (read JSON, iterate langs). Extracting it adds indirection for minimal benefit at this scale.
