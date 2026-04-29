# Quickstart: Static CV Website Pages

**Feature**: 002-cv-website-pages | **Date**: 2026-04-13

## Prerequisites

- Node.js 18+ and npm
- Source content in `specs-input/cv/`, `specs-input/about/`, `specs-input/not-found/`

## Setup

```bash
# Install dependencies
npm install

# Build content pipeline (generates public/content/site-content.json)
npm run content:build

# Validate generated content against schema
npm run content:validate

# Start development server
npm run dev
```

Site runs at `http://localhost:3000`. Opens to `/` which redirects to `/en/`.

## Key Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build (runs content:build first via `export` script) |
| `npm run export` | Build content + Next.js static export |
| `npm run content:build` | Regenerate `site-content.json` from source files |
| `npm run content:validate` | Validate `site-content.json` against JSON schema |
| `npm run content:check` | Build + validate content in one step |

## Content Pipeline Flow

```
specs-input/cv/*/meta.txt + en.txt + sv.txt
specs-input/about/en.txt + sv.txt
specs-input/not-found/en.txt + sv.txt
specs-input/tech-categories.json
        │
        ▼
tools/build-content.ts (tsx runner)
        │
        ▼
public/content/site-content.json
        │
        ▼
lib/content/loadContent.ts (static import)
        │
        ▼
Next.js pages (build-time rendering)
        │
        ▼
out/ (static HTML/CSS/JS)
```

## Contact Form (EmailJS)

Create `.env.local` with:

```
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_key
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template
```

These are required for the contact form to send emails. If missing, the form shows an error state.

## URL Routes

| URL | Page |
|-----|------|
| `/` | Redirects → `/en/` |
| `/en/` | CV page (English) |
| `/sv/` | CV page (Swedish) |
| `/en/technologies` | Technologies page |
| `/en/about` | About page |
| `/en/contact` | Contact page |
| `/about` | Redirects → `/en/about` |
| `/*` (unknown) | 404 not-found page (English) |
