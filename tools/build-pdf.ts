#!/usr/bin/env tsx
import { readFileSync, readdirSync, unlinkSync } from "fs";
import { join } from "path";
import puppeteer from "puppeteer";

interface LocalizedText {
  en: string;
  sv: string;
}

interface CVEntry {
  id: string;
  type: string;
  period: {
    raw: string;
    start: string;
    end: string | null;
  };
  sortKey: string;
  organization: string;
  client: string | null;
  role: string;
  location: string;
  locationType: string;
  title: LocalizedText;
  description: LocalizedText;
  technologies: string[];
}

interface TechItem {
  name: string;
  years: number;
}

interface SiteContent {
  person: { name: string; role: string };
  cv: {
    summary: LocalizedText;
    education: CVEntry[];
    roles: CVEntry[];
    assignments: CVEntry[];
  };
  technologies: Record<string, TechItem[]>;
  ui: {
    pdf: { date: string };
    cv: {
      sections: {
        education: LocalizedText;
        roles: LocalizedText;
        assignments: LocalizedText;
      };
      present: LocalizedText;
    };
  };
}

type Lang = "en" | "sv";

const LANGS: Lang[] = ["en", "sv"];
const PUBLIC_DIR = join(process.cwd(), "public");
const CONTENT_PATH = join(PUBLIC_DIR, "content/site-content.json");

function formatPeriod(
  entry: CVEntry,
  lang: Lang,
  presentLabel: string,
): string {
  const start = entry.period.start;
  const end = entry.period.end;
  const startStr =
    start.length === 6
      ? `${start.substring(0, 4)}-${start.substring(4, 6)}`
      : start;
  if (!end) return `${startStr} – ${presentLabel}`;
  const endStr =
    end.length === 6 ? `${end.substring(0, 4)}-${end.substring(4, 6)}` : end;
  return `${startStr} – ${endStr}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderEntries(
  entries: CVEntry[],
  lang: Lang,
  presentLabel: string,
  showTech = false,
): string {
  const techLabel = lang === "en" ? "Technologies" : "Teknologier";
  return entries
    .map((entry) => {
      const period = formatPeriod(entry, lang, presentLabel);
      const org = entry.client
        ? `${escapeHtml(entry.organization)} — ${escapeHtml(entry.client)}`
        : escapeHtml(entry.organization);
      const title = escapeHtml(entry.title[lang]);
      const desc = escapeHtml(entry.description[lang])
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => `<p>${line}</p>`)
        .join("\n");
      const techHtml =
        showTech && entry.technologies.length > 0
          ? `<div class="tech-row" style="margin-top:4pt"><span class="tech-cat">${techLabel}:</span> ${escapeHtml(entry.technologies.join(", "))}</div>`
          : "";
      return `
      <div class="entry">
        <div class="entry-header">
          <span class="entry-org">${org}</span>
          <span class="entry-period">${period}</span>
        </div>
        <div class="entry-title">${title}</div>
        <div class="entry-desc">${desc}</div>
        ${techHtml}
      </div>`;
    })
    .join("\n");
}

function renderTechnologies(technologies: Record<string, TechItem[]>): string {
  return Object.entries(technologies)
    .map(([category, items]) => {
      const names = items.map((t) => t.name).join(", ");
      return `<div class="tech-row"><span class="tech-cat">${escapeHtml(category)}:</span> ${escapeHtml(names)}</div>`;
    })
    .join("\n");
}

function buildHtml(content: SiteContent, lang: Lang): string {
  const presentLabel = content.ui.cv.present[lang];
  const sections = content.ui.cv.sections;
  const techLabel = lang === "en" ? "Technologies" : "Teknologier";

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Instrument+Sans:wght@400;500;600&display=swap');

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 9.5pt;
  line-height: 1.5;
  color: #1a1816;
}

h1, h2, h3 {
  font-family: 'Fraunces', serif;
  color: #1a1816;
}

h1 {
  font-size: 22pt;
  font-weight: 700;
  margin-bottom: 2pt;
}

.role {
  font-family: 'Instrument Sans', sans-serif;
  font-size: 10pt;
  font-weight: 600;
  color: #1a6b4a;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 16pt;
}

h2 {
  font-size: 13pt;
  font-weight: 600;
  color: #1a6b4a;
  margin-top: 18pt;
  margin-bottom: 8pt;
  padding-bottom: 4pt;
  border-bottom: 1px solid #e5e2dc;
}

.summary {
  margin-bottom: 12pt;
  line-height: 1.6;
}

.summary p {
  margin-bottom: 4pt;
}

.summary p:last-child {
  margin-bottom: 0;
}

.entry {
  margin-bottom: 10pt;
  page-break-inside: avoid;
}

.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8pt;
}

.entry-period {
  font-size: 8.5pt;
  color: #7a756d;
  white-space: nowrap;
  flex-shrink: 0;
}

.entry-org {
  font-weight: 600;
  font-size: 9.5pt;
}

.entry-title {
  font-weight: 500;
  font-size: 9pt;
  color: #7a756d;
  margin-top: 1pt;
}

.entry-desc {
  margin-top: 3pt;
  font-size: 9pt;
  line-height: 1.5;
  color: #1a1816;
}

.entry-desc p {
  margin-bottom: 4pt;
}

.entry-desc p:last-child {
  margin-bottom: 0;
}

.tech-row {
  margin-bottom: 4pt;
  font-size: 9pt;
  line-height: 1.5;
}

.tech-cat {
  font-weight: 600;
  color: #1a6b4a;
}
</style>
</head>
<body>
<h1>${escapeHtml(content.person.name)}</h1>
<div class="role">${escapeHtml(content.person.role)}</div>

<div class="summary">${escapeHtml(content.cv.summary[lang])
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => `<p>${l}</p>`)
    .join("\n")}</div>

<h2>${sections.education[lang]}</h2>
${renderEntries(content.cv.education, lang, presentLabel)}

<h2>${sections.roles[lang]}</h2>
${renderEntries(content.cv.roles, lang, presentLabel)}

<h2>${sections.assignments[lang]}</h2>
${renderEntries(content.cv.assignments, lang, presentLabel, true)}

<h2>${techLabel}</h2>
${renderTechnologies(content.technologies)}
</body>
</html>`;
}

async function main(): Promise<void> {
  console.log("=== PDF Build ===\n");

  // Read site content
  console.log("Reading site content...");
  let content: SiteContent;
  try {
    const raw = readFileSync(CONTENT_PATH, "utf-8");
    content = JSON.parse(raw);
  } catch (err) {
    console.error(`Error: Could not read ${CONTENT_PATH}`);
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  const date = content.ui?.pdf?.date;
  if (!date) {
    console.error("Error: ui.pdf.date not found in site-content.json");
    console.error('Run "npm run content:build" first.');
    process.exit(1);
  }

  // Delete old PDF files
  console.log("Deleting old PDF files...");
  const existingPdfs = readdirSync(PUBLIC_DIR).filter(
    (f) => f.startsWith("cv-") && f.endsWith(".pdf"),
  );
  for (const f of existingPdfs) {
    unlinkSync(join(PUBLIC_DIR, f));
    console.log(`  Deleted: ${f}`);
  }
  if (existingPdfs.length === 0) {
    console.log("  No old PDF files found.");
  }

  // Launch browser
  console.log("Launching browser...");
  const browser = await puppeteer.launch({ headless: true });

  try {
    for (const lang of LANGS) {
      const filename = `cv-${lang}-${date}.pdf`;
      console.log(`Generating ${filename}...`);

      const page = await browser.newPage();
      const html = buildHtml(content, lang);

      await page.setContent(html, { waitUntil: "networkidle0" });

      await page.pdf({
        path: join(PUBLIC_DIR, filename),
        format: "A4",
        margin: { top: "20mm", right: "20mm", bottom: "20mm", left: "20mm" },
        printBackground: true,
      });

      const pages = await page.evaluate(() => {
        // Approximate page count based on body height vs A4
        return Math.ceil(document.body.scrollHeight / 1050);
      });

      await page.close();
      console.log(`  ✓ ${filename} (~${pages} pages)`);
    }
  } finally {
    console.log("Closing browser...");
    await browser.close();
  }

  console.log(`\n✓ PDF build complete!`);
  console.log(`  Files generated: ${LANGS.length}`);
  console.log(`  Output directory: public/`);
}

main();
