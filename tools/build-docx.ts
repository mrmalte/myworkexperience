#!/usr/bin/env tsx
import { readFileSync, readdirSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

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

function buildEntryParagraphs(
  entries: CVEntry[],
  lang: Lang,
  presentLabel: string,
  showTech: boolean,
): Paragraph[] {
  const techLabel = lang === "en" ? "Technologies" : "Teknologier";
  const paragraphs: Paragraph[] = [];

  for (const entry of entries) {
    const period = formatPeriod(entry, lang, presentLabel);
    const org = entry.client
      ? `${entry.organization} — ${entry.client}`
      : entry.organization;

    // Organization + period (bold)
    paragraphs.push(
      new Paragraph({
        spacing: { before: 120 },
        children: [
          new TextRun({
            text: `${org} — ${period}`,
            bold: true,
            font: "Calibri",
          }),
        ],
      }),
    );

    // Title (italic)
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: entry.title[lang],
            italics: true,
            font: "Calibri",
          }),
        ],
      }),
    );

    // Description
    const descLines = entry.description[lang]
      .split("\n")
      .filter((l) => l.trim());
    for (const line of descLines) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: line, font: "Calibri" })],
        }),
      );
    }

    // Technologies line (only for assignments with non-empty technologies)
    if (showTech && entry.technologies.length > 0) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${techLabel}: `,
              bold: true,
              font: "Calibri",
            }),
            new TextRun({
              text: entry.technologies.join(", "),
              font: "Calibri",
            }),
          ],
        }),
      );
    }
  }

  return paragraphs;
}

function buildTechParagraphs(
  technologies: Record<string, TechItem[]>,
): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  for (const [category, items] of Object.entries(technologies)) {
    const names = items.map((t) => t.name).join(", ");
    paragraphs.push(
      new Paragraph({
        spacing: { before: 60 },
        children: [
          new TextRun({ text: `${category}: `, bold: true, font: "Calibri" }),
          new TextRun({ text: names, font: "Calibri" }),
        ],
      }),
    );
  }

  return paragraphs;
}

function buildDocument(content: SiteContent, lang: Lang): Document {
  const presentLabel = content.ui.cv.present[lang];
  const sections = content.ui.cv.sections;
  const techSectionLabel = lang === "en" ? "Technologies" : "Teknologier";

  // Summary paragraphs
  const summaryParagraphs = content.cv.summary[lang]
    .split("\n")
    .filter((l) => l.trim())
    .map(
      (line) =>
        new Paragraph({
          children: [new TextRun({ text: line, font: "Calibri" })],
        }),
    );

  const doc = new Document({
    sections: [
      {
        children: [
          // Person name (Heading1, Cambria)
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({ text: content.person.name, font: "Cambria" }),
            ],
          }),
          // Role (Normal, bold, uppercase, Calibri)
          new Paragraph({
            children: [
              new TextRun({
                text: content.person.role.toUpperCase(),
                bold: true,
                font: "Calibri",
              }),
            ],
          }),
          // Summary
          ...summaryParagraphs,
          // Education section
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240 },
            children: [
              new TextRun({ text: sections.education[lang], font: "Cambria" }),
            ],
          }),
          ...buildEntryParagraphs(
            content.cv.education,
            lang,
            presentLabel,
            false,
          ),
          // Roles section
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240 },
            children: [
              new TextRun({ text: sections.roles[lang], font: "Cambria" }),
            ],
          }),
          ...buildEntryParagraphs(content.cv.roles, lang, presentLabel, false),
          // Assignments section
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240 },
            children: [
              new TextRun({
                text: sections.assignments[lang],
                font: "Cambria",
              }),
            ],
          }),
          ...buildEntryParagraphs(
            content.cv.assignments,
            lang,
            presentLabel,
            true,
          ),
          // Technologies section
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240 },
            children: [
              new TextRun({ text: techSectionLabel, font: "Cambria" }),
            ],
          }),
          ...buildTechParagraphs(content.technologies),
        ],
      },
    ],
  });

  return doc;
}

async function main(): Promise<void> {
  console.log("=== DOCX Build ===\n");

  // Read site content
  console.log("Reading site content...");
  let content: SiteContent;
  try {
    const raw = readFileSync(CONTENT_PATH, "utf-8");
    content = JSON.parse(raw);
  } catch (err) {
    console.error(`Error: Could not read ${CONTENT_PATH}`);
    process.exit(1);
  }

  const date = content.ui?.pdf?.date;
  if (!date) {
    console.error("Error: ui.pdf.date not found in site-content.json");
    process.exit(1);
  }

  // Delete old DOCX files
  console.log("Deleting old DOCX files...");
  const existingDocx = readdirSync(PUBLIC_DIR).filter(
    (f) => f.startsWith("cv-") && f.endsWith(".docx"),
  );
  for (const f of existingDocx) {
    unlinkSync(join(PUBLIC_DIR, f));
    console.log(`  Deleted: ${f}`);
  }
  if (existingDocx.length === 0) {
    console.log("  No old DOCX files found.");
  }

  // Generate DOCX for each language
  let fileCount = 0;

  for (const lang of LANGS) {
    const filename = `cv-${lang}-${date}.docx`;
    console.log(`Generating ${filename}...`);

    const doc = buildDocument(content, lang);
    const buffer = await Packer.toBuffer(doc);
    writeFileSync(join(PUBLIC_DIR, filename), buffer);
    console.log(`  ✓ ${filename}`);
    fileCount++;
  }

  console.log(`\n✓ DOCX build complete!`);
  console.log(`  Files generated: ${fileCount}`);
  console.log(`  Output directory: public/`);
}

main();
