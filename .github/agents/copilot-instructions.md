# myworkexperience Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-01-10

## Active Technologies
- TypeScript 5.x (build tools + Next.js pages) + Next.js 15 (`output: "export"`), React 19, @emailjs/browser, Tailwind CSS 4, tsx (build tool runner), ajv (schema validation) (002-cv-website-pages)
- File-based — `specs-input/cv/` text files → `public/content/site-content.json` (build artifact) (002-cv-website-pages)
- TypeScript 5 (executed via `tsx`) + `basic-ftp` (FTP client), `dotenv` (env file loader) (003-ftp-deploy)
- N/A (no database; reads local `out/` directory, uploads to remote FTP) (003-ftp-deploy)
- TypeScript (ES2020 target), Node.js, Next.js 15 + `basic-ftp` ^5.3.0, `dotenv`, `tsx` (runner) (003-ftp-deploy)
- N/A (file-based static export to `out/`) (003-ftp-deploy)
- TypeScript 5, React 19, Next.js 15 + Next.js, React, Tailwind CSS, EmailJS, JSON Schema, tsx, ajv (002-cv-website-pages)
- Filesystem (content in specs-input/, output in public/content/) (002-cv-website-pages)
- TypeScript 5.x, Next.js 15 (App Router, `output: "export"`) + React 19, Next.js 15, @emailjs/browser, tsx (runner) (002-cv-website-pages)
- Static JSON file (`public/content/site-content.json`) generated at build time (002-cv-website-pages)
- TypeScript 5.x, Next.js 15 (App Router, `output: "export"`) + React 19, Tailwind CSS, @emailjs/browser (002-cv-website-pages)

- TypeScript + Node.js LTS (for tooling and Next.js build) + Next.js, React, Tailwind CSS (configured with mockup design tokens), Google Fonts (Fraunces + Instrument Sans), `@emailjs/browser`, AJV (JSON Schema validation) (002-cv-website-pages)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript + Node.js LTS (for tooling and Next.js build): Follow standard conventions

## Recent Changes
- 002-cv-website-pages: Added TypeScript 5.x, Next.js 15 (App Router, `output: "export"`) + React 19, Tailwind CSS, @emailjs/browser
- 002-cv-website-pages: Added TypeScript 5.x, Next.js 15 (App Router, `output: "export"`) + React 19, Tailwind CSS, @emailjs/browser
- 002-cv-website-pages: Added TypeScript 5.x, Next.js 15 (App Router, `output: "export"`) + React 19, Next.js 15, @emailjs/browser, tsx (runner)


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
