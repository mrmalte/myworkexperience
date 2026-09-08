# My Work Experience - CV Website

A static Next.js website showcasing professional CV and work experience with bilingual support (English/Swedish).

## Features

- **Bilingual Support**: Navigate between English (`/en/`) and Swedish (`/sv/`)
- **Responsive Layout**: Mobile-friendly design (≤720 px) with hamburger navigation, touch-friendly controls, and adaptive content layout
- **CV Browsing**: View categorized work experience (Summary, Education, Roles, Assignments) with search and expand/collapse
- **Technologies Chart**: Interactive technology experience chart with category filtering and sort
- **Contact Form**: Send messages via EmailJS integration
- **Static Export**: Generates plain HTML/CSS/JS for deployment anywhere

## Tech Stack

- **Next.js 15** with App Router and static export
- **React 19**
- **TypeScript** (strict mode)
- **Tailwind CSS** for styling
- **EmailJS** for contact form submissions
- **JSON Schema** validation for content

## Getting Started

### Prerequisites

- Node.js LTS (v18 or later)
- npm or yarn

### Installation

```bash
npm install
```

### Environment Variables

For the contact form to work, you need to configure EmailJS. Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key
```

**How to get EmailJS credentials:**

1. Sign up at [https://www.emailjs.com/](https://www.emailjs.com/)
2. Create an email service (Gmail, Outlook, etc.)
3. Create an email template with variables: `from_name`, `from_email`, `message`
4. Get your Public Key from Account settings
5. Copy the Service ID, Template ID, and Public Key to `.env.local`

### Content Generation

The CV content is sourced from the `specs-input/cv/` and `specs-input/not-found/` directories. Generate the JSON content file:

```bash
# Generate and validate content in one command
npm run content:check

# Or run steps separately:
npm run content:build    # Generate public/content/site-content.json
npm run content:validate # Validate against JSON Schema
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site. It will redirect to `/en/` automatically.

### Build & Export

```bash
npm run build   # Build the Next.js application
npm run export  # Export static HTML (runs build + content:build automatically)
```

The static site will be generated in the `out/` directory, ready for deployment.

## Project Structure

```
├── app/                      # Next.js App Router pages
│   ├── [lang]/              # Language-specific routes
│   │   ├── contact/
│   │   ├── technologies/
│   │   └── page.tsx         # CV page (root for each language)
│   └── page.tsx             # Root redirect to /en/
├── components/              # React components
│   ├── ContactForm.tsx      # EmailJS contact form
│   ├── CvPageClient.tsx     # CV page with search and summary
│   ├── CvSections.tsx       # CV display with expand/collapse
│   ├── HamburgerDrawer.tsx  # Reusable mobile hamburger + drawer
│   ├── Header.tsx           # Site header with name/role
│   ├── Menu.tsx             # Navigation menu with language switcher
│   └── TechChart.tsx        # Technology experience chart
├── lib/                     # Shared utilities
│   ├── content/             # Content loading
│   └── i18n/                # Language helpers
├── tools/                   # Build-time tooling
│   ├── build-content.ts     # Generate site-content.json
│   ├── deploy-ftp.ts        # FTP deploy script
│   ├── validate-content.ts  # JSON Schema validation
│   └── content/             # Content parsing utilities
├── specs-input/             # Source data
│   ├── cv/                  # CV entries (meta.txt + en.txt + sv.txt)
│   └── not-found/          # 404 text (en.txt + sv.txt)
├── public/                  # Static assets
│   └── content/             # Generated site-content.json
└── specs/                   # Feature specifications and planning
```

## Content Format

CV entries in `specs-input/cv/` follow the format defined in `specs/001-cv-data-format/spec.md`:

- **Directory naming**: `YYYYMM_OrganizationName/` or `YYYYMM_OrganizationName_summary/`
- **Required files**: `meta.txt`, `en.txt`, `sv.txt`
- **Meta keys**: Type, Organization, Period, Role, Location, LocationType, Client (conditional)

## Deployment

The site is deployed into a `/cv` subdirectory on the server (`https://malte.sarner.se/cv/`), not
the domain root. This requires two things beyond a normal static deploy:

1. `NEXT_PUBLIC_BASE_PATH=/cv` in `.env.production` (already committed — no secret) tells the Next.js
   build to prefix every route, asset, and download link with `/cv`. It has no effect on
   `npm run dev`, which stays unprefixed at `/` for local development.
2. A redirect at the **domain root** sends the bare domain to `/cv/`. This is a separate Apache
   config file, `deploy/root.htaccess`, uploaded manually to the server's document root (outside
   `/cv/`) — see below.

### FTP Deploy

The project includes a built-in FTP deploy script.

**Setup:**

Add FTP credentials to `.env.local`:

```env
FTP_HOST=your-ftp-host
FTP_USER=your-ftp-username
FTP_PASS=your-ftp-password
FTP_REMOTE_DIR=/malte.sarner.se/public_html/cv
```

**`FTP_REMOTE_DIR` is a filesystem path on the FTP server, not the site's URL path — don't assume
they're the same string.** The site's URL base path (`/cv`, from `NEXT_PUBLIC_BASE_PATH` above) and
the FTP remote directory are two independent settings that happen to share a name. On this Loopia
account, the FTP session's root is the shared hosting account root (with `malte.sarner.se`,
`gustaf.sarner.se`, etc. as siblings), not the domain's `public_html/` — so `FTP_REMOTE_DIR=/cv`
silently uploads to a directory that Apache never serves, while `/cv` on the live site keeps showing
stale content. Confirm the real path for your account before deploying:

```bash
curl --ftp-ssl -v -u your-ftp-username \
  -Q "PWD" -Q "CWD /malte.sarner.se/public_html/cv" -Q "PWD" \
  "ftp://your-ftp-host/" -o /dev/null 2>&1 | grep -E "^< 257|^> (PWD|CWD)"
```

Two `257` replies confirm the session's home directory and that the target path resolves correctly
via the same protocol (FTPS) the deploy script uses — a working plain-FTP client (e.g. `ncftp`) can
land in a different directory than FTPS on the same account, so don't rely on it to verify the FTPS
path. The deploy command uploads `out/` into the configured directory and scopes its stale PDF/DOCX
cleanup to it; it never touches the domain root.

**Deploy commands:**

```bash
npm run deploy        # Upload the existing build (out/) via FTP
npm run deploy:full   # Build the site first, then deploy
```

The deploy script attempts FTPS (TLS) first and falls back to plain FTP if needed.

**One-time manual step — root redirect:**

Upload `deploy/root.htaccess` to the domain's document root as `.htaccess` (a sibling of `/cv/`,
not inside it). This is never done by the deploy command — see
[specs/006-base-path-deploy/contracts/root-htaccess.md](specs/006-base-path-deploy/contracts/root-htaccess.md)
for the exact content and verification commands. If the domain root previously hosted the site
directly (before it moved to `/cv`), the old files there (`index.html`, `en/`, `sv/`, `_next/`,
old `cv-*.pdf`/`.docx`) need to be migrated or removed manually as a separate one-time step.

### Other Hosting

The static export in `out/` can be deployed to any static hosting:

- **Vercel/Netlify**: Connect your repo and deploy
- **GitHub Pages**: Copy `out/` to `gh-pages` branch
- **AWS S3/CloudFront**: Upload `out/` to S3 bucket
- **Any web server**: Serve the `out/` directory

## License

Private project - All rights reserved.
