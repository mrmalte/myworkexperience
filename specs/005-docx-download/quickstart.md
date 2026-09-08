# Quickstart: DOCX Download

## Prerequisites

- Node.js installed
- Dependencies installed (`npm install`)
- Content built (`npm run content:build`) — produces `public/content/site-content.json`

## Build DOCX files

```bash
# Standard build (all roles included)
npm run docx:build

# With latest role omitted
npm run docx:build -- --skip-latest-role
```

Output: `public/cv-en-YYYY-MM-DD.docx` and `public/cv-sv-YYYY-MM-DD.docx`

## Full pipeline (content + PDF + DOCX + site + deploy)

```bash
npm run deploy:full
```

## Development workflow

```bash
# 1. Build content (needed for both PDF and DOCX)
npm run content:build

# 2. Build DOCX (optional — only needed to test download links)
npm run docx:build

# 3. Run dev server
npm run dev
```

The download dropdown will show in navigation. Links will 404 if build commands haven't been run — this is expected in dev.

## Key files

| File                     | Purpose                                                |
| ------------------------ | ------------------------------------------------------ |
| `tools/build-docx.ts`    | DOCX generator (reads site-content.json)               |
| `tools/build-content.ts` | Content builder (add `ui.nav.download`, `ui.nav.word`) |
| `tools/deploy-ftp.ts`    | FTP deploy (extended cleanup for .docx)                |
| `components/Menu.tsx`    | Navigation with download dropdown                      |
| `package.json`           | Scripts and `docx` devDependency                       |

## Verify output

1. Run `npm run docx:build`
2. Open `public/cv-en-*.docx` in Word/LibreOffice
3. Confirm: headings in Cambria, body in Calibri, all CV sections present
4. Check assignments have "Technologies: ..." lines beneath descriptions
