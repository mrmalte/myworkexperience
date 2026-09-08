# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this project is

A static Next.js 15 site presenting Malte Särner's CV in English and Swedish. Content is authored as
plain text files under `specs-input/`, compiled into a single JSON file at build time, and rendered
into a fully static export (`out/`) plus downloadable PDF and DOCX versions of the CV.

Stack: Next.js 15 (App Router, `output: "export"`), React 19, TypeScript (strict), Tailwind CSS,
EmailJS for the contact form. Build tooling is TypeScript run via `tsx`.

## Spec-Driven Development — read this first

This is a **spec-kit** project. Specs and code MUST always be in sync.

For any change that is not truly trivial (typo, formatting, one-line bug fix), work through **all**
the spec-kit steps in order — do not skip to code:

1. **Spec** — `/speckit.specify` (or edit `spec.md` directly) — what and why, no implementation detail
2. **Plan** — `/speckit.plan` — technical approach, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`
3. **Tasks** — `/speckit.tasks` — dependency-ordered `tasks.md`
4. **Code** — `/speckit.implement` — implement the tasks, keeping `tasks.md` checkboxes current

**Prefer updating an existing spec over creating a new one.** If a change extends, corrects, or
refines behavior already covered by a feature under `specs/`, update that feature's `spec.md`,
`plan.md`, and `tasks.md` rather than starting a new numbered feature. Create a new feature
directory only when the change is a genuinely new capability that does not belong to any existing
feature.

When updating an existing spec, cascade the change: spec → plan → tasks → code. Leaving `plan.md` or
`tasks.md` stale after a spec edit counts as unfinished work.

Related skills: `/speckit.clarify` (resolve ambiguity before planning), `/speckit.analyze`
(cross-artifact consistency check after tasks), `/speckit.checklist`, `/speckit.converge`.

### Using the spec-kit skills

Prefer the `/speckit.*` skills over hand-editing the artifacts — they apply the templates in
`.specify/templates/` and keep the structure consistent. Two constraints decide whether a skill can
actually run, so check these first rather than discovering them mid-task:

**They need a resolvable feature.** Every skill except `/speckit.specify` gates on
`.specify/scripts/bash/check-prerequisites.sh`, which needs `.specify/feature.json` or an explicit
override. On the `main` branch with neither set, it fails with
`ERROR: Feature directory not found`. To run a skill against an existing feature from `main`, point
it at the directory:

```bash
SPECIFY_FEATURE_DIRECTORY=specs/002-cv-website-pages
```

**`/speckit.specify` always creates a new feature.** It calls `create-new-feature.sh`, which mints
the next sequential number, directory, and branch. That makes it the wrong tool for changes to an
existing feature — it contradicts the "prefer updating an existing spec" rule above. For those,
edit the existing `spec.md` by hand (add a `## Clarifications` session entry recording the decision
and what changed), then use `/speckit.plan` and `/speckit.tasks` with `SPECIFY_FEATURE_DIRECTORY`
set, or continue by hand in the same templates.

Use `/speckit.analyze` after any substantial artifact edit, hand-made or not — it is non-destructive
and catches spec/plan/tasks drift that manual editing tends to leave behind.

### Existing features

| Feature | Directory | Scope |
| --- | --- | --- |
| 001 | [specs/001-cv-data-format/](specs/001-cv-data-format/) | On-disk CV source format (`specs-input/cv/`) |
| 002 | [specs/002-cv-website-pages/](specs/002-cv-website-pages/) | Site pages, layout, search, tech chart, contact form |
| 003 | [specs/003-ftp-deploy/](specs/003-ftp-deploy/) | FTP/FTPS deployment tool |
| 004 | [specs/004-pdf-download/](specs/004-pdf-download/) | Build-time PDF generation + nav download link |
| 005 | [specs/005-docx-download/](specs/005-docx-download/) | Build-time DOCX generation + Download dropdown |
| 006 | [specs/006-base-path-deploy/](specs/006-base-path-deploy/) | Serving the site from a `/cv/` subdirectory + root redirect |
| 007 | [specs/007-linkedin-export/](specs/007-linkedin-export/) | Paste-ready LinkedIn profile text generated from the CV |

Feature branches are named `NNN-short-name` and match the directory name. Numbering is sequential.

### Constitution

[.specify/memory/constitution.md](.specify/memory/constitution.md) is authoritative and supersedes
feature plans. Its three gates must be re-checked in every plan:

1. Output is static HTML/CSS/JS — no SSR
2. Custom build tooling is TypeScript
3. `specs-input/cv/` remains the source of truth; generated artifacts are never hand-edited

## Architecture

```
specs-input/          Source of truth (hand-authored)
  cv/YYYYMM_Org[_summary]/   meta.txt + en.txt + sv.txt per entry
  not-found/                 en.txt + sv.txt
  linkedin/                  en.txt + sv.txt (headline + About tail)
  tech-categories.json       technology → category mapping
        │
        │  tools/build-content.ts  (+ tools/content/parseSource.ts)
        ▼
public/content/site-content.json   Generated. Git-ignored. Never edit by hand.
        │
        ├─ app/ + components/  →  next build  →  out/   (static site)
        ├─ tools/build-pdf.ts  (Puppeteer)     →  public/cv-{lang}-{date}.pdf
        ├─ tools/build-docx.ts (docx lib)      →  public/cv-{lang}-{date}.docx
        │                                               │
        │                                 tools/deploy-ftp.ts → FTP host
        │
        └─ tools/build-linkedin.ts             →  linkedin/linkedin-{lang}.md
           (+ specs-input/linkedin/)              Local only. Never served, never deployed.
```

Key points:

- `site-content.json` is the single runtime contract between the build tools and the UI. Its shape is
  typed in [lib/content/loadContent.ts](lib/content/loadContent.ts) and validated against
  [specs/002-cv-website-pages/contracts/site-content.schema.json](specs/002-cv-website-pages/contracts/site-content.schema.json)
  by `tools/validate-content.ts`. **Adding a field means updating the interface, the schema, and the
  builder together.**
- All user-facing strings live in `site-content.json` under `ui.*` (emitted by `build-content.ts`),
  not hardcoded in components. Every string needs both `en` and `sv`.
- `ui.pdf.date` is written by the content build and is what determines PDF/DOCX filenames and the
  nav download hrefs — the date is never derived at runtime in a client component.
- Routes are language-prefixed: `app/[lang]/…` with `/` redirecting to `/en/`. The non-prefixed
  `app/contact|technologies` pages exist for redirects.
- PDF and DOCX are generated into `public/` **before** `next build` so the static export picks them up.

## Commands

```bash
npm run dev              # Next dev server (http://localhost:3000 → /en/)
npm run content:build    # specs-input/ → public/content/site-content.json
npm run content:validate # Validate site-content.json against the JSON Schema
npm run content:check    # build + validate
npm run pdf:build        # Generate cv-{lang}-{date}.pdf (needs headless Chromium)
npm run docx:build       # Generate cv-{lang}-{date}.docx
npm run linkedin:build   # Generate linkedin/linkedin-{lang}.md (paste-ready LinkedIn text)
npm run build            # next build → out/
npm run deploy           # Upload existing out/ over FTPS (falls back to FTP)
npm run deploy:full      # content + pdf + docx + build + deploy
npm run lint
npm run clean            # Remove out/, .next/, linkedin/, and generated content/PDF/DOCX
```

Content is git-ignored generated output, so after pulling or cleaning run `npm run content:check`
before `npm run dev` or the app will fail to resolve `site-content.json`.

Verify changes with the relevant build step (`content:check`, `pdf:build`, `docx:build`,
`linkedin:build`, `build`) —
there is no automated test suite; the specs define manual acceptance scenarios instead.

## Deployment

The live site is served from `https://malte.sarner.se/cv/`, not the domain root (see
[specs/006-base-path-deploy](specs/006-base-path-deploy/spec.md)). Two things follow from that:

- `NEXT_PUBLIC_BASE_PATH=/cv` in `.env.production` drives Next's `basePath` — this governs URLs the
  **browser** sees and is unrelated to the point below. Any raw `<a href>` that isn't a `next/link`
  (the PDF/Word download anchors in `components/Menu.tsx`) must read this env var and prefix itself
  manually; `basePath` does not reach raw anchors.
- The domain root redirects to `/cv/` via `deploy/root.htaccess` — version-controlled but **never**
  uploaded by `tools/deploy-ftp.ts`; it lives outside `out/` by design and must be placed on the
  server by hand (one-time, or whenever it changes).

**`FTP_REMOTE_DIR` (in `.env.local`) is a filesystem path on the FTP server — it has no required
relationship to the site's URL path, even though both are currently `/cv` in name.** On this
account (Loopia, `ftpcluster.loopia.se`), the FTP session's root is the shared hosting account root
(`malte.sarner.se`, `gustaf.sarner.se`, etc. as sibling directories), not the domain's
`public_html/`. A bare `FTP_REMOTE_DIR=/cv` silently uploads outside the served tree with no error —
the deploy script reports success either way. The correct value is
`FTP_REMOTE_DIR=/malte.sarner.se/public_html/cv`. Before trusting any `FTP_REMOTE_DIR` value on a
new host or account, verify it resolves where you think via the same protocol the deploy script uses
(FTPS) — a plain-FTP client can report a different home directory than an FTPS session on the same
account:

```bash
curl --ftp-ssl -v -u your-ftp-username \
  -Q "PWD" -Q "CWD /candidate/path" -Q "PWD" \
  "ftp://your-ftp-host/" -o /dev/null 2>&1 | grep -E "^< 257|^> (PWD|CWD)"
```

Full diagnosis: [specs/006-base-path-deploy/research.md#r7](specs/006-base-path-deploy/research.md#r7-ftp_remote_dir-is-a-filesystem-path-not-the-sites-url-path).

## Conventions

- **CV entries**: directory `YYYYMM_OrganizationName/` or `YYYYMM_OrganizationName_summary/`, each with
  `meta.txt`, `en.txt`, `sv.txt`. Meta keys: `Type`, `Organization`, `Period`, `Role`, `Location`,
  `LocationType`, `Technologies`, and `Client` (assignments only). Format rules live in
  [specs/001-cv-data-format/spec.md](specs/001-cv-data-format/spec.md).
- **Bilingual by default**: any new content or UI string must exist in both `en` and `sv`.
- **How entry text is written** (applied across all entries 2026-09-07):
  - *Assignments* get three paragraphs — what the system or product is, in the client's terms; what
    **I** did, in first person and concrete; how it is built (stack, deployment, source control). A
    fourth paragraph on process only when it says something.
  - *Employments* (`*_summary`) get 2–3 sentences: what the company does, what the role was, its
    scope. These are the LinkedIn position descriptions, so "I worked as a consultant at X" is not
    enough.
  - Past tense for finished work, present for ongoing. Paragraphs 1 and 3 impersonal, paragraph 2
    first person.
  - Titles name the system or project where one exists (`Fixa`, `ErrorPrediction`); Swedish titles
    are Swedish, except established job titles (`Technical Lead`, `Senior Staff Engineer`).
  - Never invent facts. Everything must trace to existing entry text, `meta.txt`, or a source the
    maintainer has confirmed.
  - File shape: `Title: …` on line 1, blank line, paragraphs separated by blank lines, trailing
    newline.
- **Technology names are canonical**: `specs-input/tech-categories.json` is the vocabulary, and
  `Technologies:` lines plus prose must use the same spelling — `React` (not ReactJS), `Node.js`,
  `Next.js`, `Express`, `JavaScript`, `TypeScript`, `Qt`, `SVN`, `gRPC`, `PostScript`, `Unicode`,
  `H.263`, `Contentful`. `build-content.ts` matches case-insensitively but not across spellings, so a
  variant silently becomes a second entry in the technology chart. Every technology used must appear
  in `tech-categories.json`, or it lands in the `Other` bucket.
- **Three renderers, one content model**: a change to CV presentation usually needs matching updates in
  the web components, `build-pdf.ts`, and `build-docx.ts`. Check all three before calling it done.
  `build-linkedin.ts` is a fourth consumer but not a presentation renderer — it emits plain text
  shaped to LinkedIn's fields, so layout changes do not reach it. A change to the *content model*
  (new field, changed period semantics) does.
- TypeScript strict mode; `@/*` path alias maps to the repo root.
- Secrets (`EmailJS`, FTP credentials) live in `.env.local` — never commit them or echo their values.
