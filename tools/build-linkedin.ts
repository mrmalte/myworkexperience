#!/usr/bin/env tsx
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import { join } from "path";

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

interface SiteContent {
  person: { name: string; role: string };
  cv: {
    summary: LocalizedText;
    education: CVEntry[];
    roles: CVEntry[];
    assignments: CVEntry[];
  };
  ui: {
    pdf: { date: string };
    cv: {
      present: LocalizedText;
    };
  };
}

type Lang = "en" | "sv";

interface LinkedInCopy {
  headline: string;
  aboutTail: string;
}

interface LimitReport {
  lang: Lang;
  label: string;
  count: number;
  limit: number;
  exceeded: boolean;
}

const LANGS: Lang[] = ["en", "sv"];
const LANG_NAMES: Record<Lang, string> = { en: "English", sv: "Swedish" };

const ROOT = process.cwd();
const CONTENT_PATH = join(ROOT, "public/content/site-content.json");
const SOURCE_DIR = join(ROOT, "specs-input/linkedin");
const OUTPUT_DIR = join(ROOT, "linkedin");

// LinkedIn's own field limits. They are product limits, not derived from this
// repo, and LinkedIn has changed them before — keep them in one place.
const LIMITS = {
  headline: 220,
  about: 2600,
  position: 2000,
  skills: 50,
  skillsPerPosition: 5,
};

function fail(message: string): never {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

// --- Periods ---------------------------------------------------------------

// site-content periods are YYYYMM, except the bare-YYYY form (both boundaries
// are the 4-digit year) and an ongoing period (end === null). Normalise to a
// comparable YYYYMM so plain string comparison orders them correctly.
function periodKey(value: string | null, isEnd: boolean): string {
  if (value === null) return isEnd ? "999999" : "000000";
  if (value.length === 4) return isEnd ? `${value}12` : `${value}01`;
  return value;
}

function months(key: string): number {
  return parseInt(key.substring(0, 4), 10) * 12 + parseInt(key.substring(4, 6), 10);
}

function overlapMonths(a: CVEntry, b: CVEntry): number {
  const start = Math.max(
    months(periodKey(a.period.start, false)),
    months(periodKey(b.period.start, false)),
  );
  const end = Math.min(
    months(periodKey(a.period.end, true)),
    months(periodKey(b.period.end, true)),
  );
  return Math.max(0, end - start);
}

function formatBoundary(value: string): string {
  return value.length === 6
    ? `${value.substring(0, 4)}-${value.substring(4, 6)}`
    : value;
}

function formatSpan(
  start: string,
  end: string | null,
  presentLabel: string,
): string {
  const startStr = formatBoundary(start);
  return end ? `${startStr} – ${formatBoundary(end)}` : `${startStr} – ${presentLabel}`;
}

function formatPeriod(entry: CVEntry, presentLabel: string): string {
  return formatSpan(entry.period.start, entry.period.end, presentLabel);
}

// --- Authored LinkedIn copy ------------------------------------------------

function readLinkedInCopy(lang: Lang): LinkedInCopy {
  const relative = `specs-input/linkedin/${lang}.txt`;
  const path = join(SOURCE_DIR, `${lang}.txt`);

  if (!existsSync(path)) {
    fail(`Missing ${relative}`);
  }

  const lines = readFileSync(path, "utf-8").split("\n");

  let firstNonEmpty = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim()) {
      firstNonEmpty = i;
      break;
    }
  }

  if (firstNonEmpty === -1) {
    fail(`${relative}: file is empty`);
  }

  const firstLine = lines[firstNonEmpty].trim();
  const match = /^headline\s*:\s*(.+)$/i.exec(firstLine);

  if (!match) {
    fail(
      `${relative}: first non-empty line must be 'Headline: ...' (got '${firstLine}')`,
    );
  }

  const headline = match[1].trim();
  if (!headline) {
    fail(`${relative}: Headline value must be non-empty`);
  }

  return {
    headline,
    aboutTail: lines
      .slice(firstNonEmpty + 1)
      .join("\n")
      .trim(),
  };
}

// --- Assignment nesting ----------------------------------------------------

function normalizeOrg(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * LinkedIn models employers as positions and has no level for consultancy
 * assignments, so every assignment has to be folded into the employment it was
 * performed during. Organization alone is not enough: three employers here have
 * two employment entries each, with touching or overlapping periods.
 */
function matchAssignments(
  roles: CVEntry[],
  assignments: CVEntry[],
): { byRole: Map<string, CVEntry[]>; unmatched: CVEntry[] } {
  const byRole = new Map<string, CVEntry[]>();
  const unmatched: CVEntry[] = [];

  for (const role of roles) {
    byRole.set(role.id, []);
  }

  for (const assignment of assignments) {
    const candidates = roles.filter(
      (role) => normalizeOrg(role.organization) === normalizeOrg(assignment.organization),
    );

    if (candidates.length === 0) {
      unmatched.push(assignment);
      continue;
    }

    const assignmentStart = periodKey(assignment.period.start, false);
    const eligible = candidates.filter(
      (role) => periodKey(role.period.start, false) <= assignmentStart,
    );
    // Started before every candidate employment (the bare-YYYY periods do this):
    // fall back to the earliest candidate rather than reporting it unmatched.
    const pool = eligible.length > 0 ? eligible : candidates;
    const preferLatestStart = eligible.length > 0;

    const best = pool.reduce((current, role) => {
      const currentStart = periodKey(current.period.start, false);
      const roleStart = periodKey(role.period.start, false);

      if (roleStart !== currentStart) {
        const roleWins = preferLatestStart
          ? roleStart > currentStart
          : roleStart < currentStart;
        return roleWins ? role : current;
      }

      const roleOverlap = overlapMonths(assignment, role);
      const currentOverlap = overlapMonths(assignment, current);
      if (roleOverlap !== currentOverlap) {
        return roleOverlap > currentOverlap ? role : current;
      }

      return periodKey(role.period.end, true) > periodKey(current.period.end, true)
        ? role
        : current;
    });

    byRole.get(best.id)!.push(assignment);
  }

  return { byRole, unmatched };
}

// --- Skills ----------------------------------------------------------------

/**
 * Skills in the order the CV itself implies: newest entry first, and within an
 * entry the order the technologies were authored in. Ranking by `technologies[].years`
 * instead puts the longest-lived tooling on top — SVN, ClearCase, CVS — which is
 * the opposite of what a profile aimed at new assignments should lead with.
 */
function orderSkills(entries: CVEntry[]): string[] {
  const ordered: string[] = [];
  const seen = new Set<string>();
  for (const entry of entries) {
    for (const tech of entry.technologies) {
      if (seen.has(tech)) continue;
      seen.add(tech);
      ordered.push(tech);
    }
  }
  return ordered;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

// --- Rendering -------------------------------------------------------------

function fence(text: string): string {
  return "```\n" + text + "\n```";
}

function heading(label: string, report: LimitReport): string {
  const over = report.exceeded ? ` ⚠ over by ${report.count - report.limit}` : "";
  return `${label} — ${report.count} / ${report.limit}${over}`;
}

function firstParagraph(description: string): string {
  const line = description.split("\n").find((l) => l.trim());
  return line ? line.trim() : "";
}

/**
 * LinkedIn positions, in the shape the profile actually uses: the client is the
 * company for consultancy work, the employer is the company for in-house work.
 *
 * - Consultancy employment (Client ≠ Organization) yields one block per client,
 *   merging several assignments at the same client into one position spanning
 *   them, plus an umbrella block for the employer itself.
 * - In-house employment (Client = Organization) yields one block per employment
 *   with the assignments as bullets — otherwise Connected Table's five
 *   assignments would become five separate LinkedIn positions.
 */
interface Block {
  kind: "client" | "in-house" | "umbrella";
  company: string;
  title: string;
  role: string;
  start: string;
  end: string | null;
  location: string;
  locationType: string;
  description: string;
  assignments: CVEntry[];
}

function isClientWork(assignment: CVEntry): boolean {
  return (
    assignment.client !== null &&
    normalizeOrg(assignment.client) !== normalizeOrg(assignment.organization)
  );
}

function bullet(
  assignment: CVEntry,
  presentLabel: string,
  lang: Lang,
  withClient: boolean,
): string {
  const client = assignment.client ?? assignment.organization;
  const label = withClient
    ? `${client} — ${assignment.title[lang]}`
    : assignment.title[lang];
  let text = `• ${label} (${formatPeriod(assignment, presentLabel)}): ${firstParagraph(
    assignment.description[lang],
  )}`;
  if (assignment.technologies.length > 0) {
    text += `\n  Tech: ${assignment.technologies.join(", ")}`;
  }
  return text;
}

function buildBlocks(
  roles: CVEntry[],
  matched: Map<string, CVEntry[]>,
  presentLabel: string,
  lang: Lang,
): Block[] {
  const blocks: Block[] = [];

  for (const role of roles) {
    const assignments = matched.get(role.id) ?? [];
    const clientWork = assignments.filter(isClientWork);

    if (clientWork.length === 0) {
      // In-house: one position for the employment, assignments as bullets.
      blocks.push({
        kind: "in-house",
        company: role.organization,
        title: role.title[lang],
        role: role.role,
        start: role.period.start,
        end: role.period.end,
        location: role.location,
        locationType: role.locationType,
        description: [
          role.description[lang].trim(),
          ...assignments.map((a) => bullet(a, presentLabel, lang, false)),
        ].join("\n\n"),
        assignments,
      });
      continue;
    }

    // Consultancy: the employer becomes an umbrella position …
    blocks.push({
      kind: "umbrella",
      company: role.organization,
      title: role.title[lang],
      role: role.role,
      start: role.period.start,
      end: role.period.end,
      location: role.location,
      locationType: role.locationType,
      description: role.description[lang].trim(),
      assignments: [],
    });

    // … and each client becomes a position of its own.
    const byClient = new Map<string, CVEntry[]>();
    for (const a of clientWork) {
      const key = normalizeOrg(a.client!);
      if (!byClient.has(key)) byClient.set(key, []);
      byClient.get(key)!.push(a);
    }

    for (const group of byClient.values()) {
      const newest = group[0];
      const first = group.reduce((acc, a) =>
        periodKey(a.period.start, false) <= periodKey(acc.period.start, false) ? a : acc,
      );
      const last = group.reduce((acc, a) =>
        periodKey(a.period.end, true) >= periodKey(acc.period.end, true) ? a : acc,
      );
      const single = group.length === 1;

      blocks.push({
        kind: "client",
        company: newest.client!,
        title: `${newest.title[lang]} - ${newest.role}`,
        role: newest.role,
        start: first.period.start,
        end: last.period.end,
        location: newest.location,
        locationType: newest.locationType,
        description: single
          ? newest.description[lang].trim()
          : group.map((a) => bullet(a, presentLabel, lang, false)).join("\n\n"),
        assignments: group,
      });
    }
  }

  // Newest first; an ongoing block sorts above a finished one that started later.
  return blocks.sort((a, b) => {
    const byStart = periodKey(b.start, false).localeCompare(periodKey(a.start, false));
    if (byStart !== 0) return byStart;
    return periodKey(b.end, true).localeCompare(periodKey(a.end, true));
  });
}

function renderDocument(
  lang: Lang,
  content: SiteContent,
  copy: LinkedInCopy,
  matched: Map<string, CVEntry[]>,
  unmatched: CVEntry[],
): { text: string; reports: LimitReport[] } {
  const presentLabel = content.ui.cv.present[lang];
  const reports: LimitReport[] = [];

  const record = (label: string, text: string, limit: number): LimitReport => {
    const report: LimitReport = {
      lang,
      label,
      count: text.length,
      limit,
      exceeded: text.length > limit,
    };
    reports.push(report);
    return report;
  };

  const out: string[] = [];

  out.push(`# LinkedIn — ${content.person.name} (${LANG_NAMES[lang]})`);
  out.push(
    `Generated ${content.ui.pdf.date} from specs-input/ · paste into linkedin.com · do not edit this file`,
  );
  out.push(
    [
      "| Field | Limit |",
      "| --- | --- |",
      `| Headline | ${LIMITS.headline} |`,
      `| About | ${LIMITS.about} |`,
      `| Position description | ${LIMITS.position} |`,
      `| Skills | ${LIMITS.skills} (${LIMITS.skillsPerPosition} per position) |`,
    ].join("\n"),
  );

  // Headline
  const headlineReport = record("Headline", copy.headline, LIMITS.headline);
  out.push(`## ${heading("Headline", headlineReport)}`);
  out.push(fence(copy.headline));

  // About
  const about = [content.cv.summary[lang].trim(), copy.aboutTail]
    .filter(Boolean)
    .join("\n\n");
  const aboutReport = record("About", about, LIMITS.about);
  out.push(`## ${heading("About", aboutReport)}`);
  out.push(fence(about));

  // Experience
  out.push("## Experience");
  const blocks = buildBlocks(content.cv.roles, matched, presentLabel, lang);
  blocks.forEach((block, index) => {
    const report = record(
      `${block.title} @ ${block.company}`,
      block.description,
      LIMITS.position,
    );
    const skills = orderSkills(block.assignments).slice(
      0,
      LIMITS.skillsPerPosition,
    );

    out.push(`### ${index + 1}. ${block.title} — ${block.company}`);
    out.push(
      [
        `Title: ${block.title} · Company: ${block.company} · Period: ${formatSpan(block.start, block.end, presentLabel)} · Location: ${block.location} · ${capitalize(block.locationType)}`,
        block.kind === "umbrella"
          ? "Umbrella position for the employer — the client assignments below sit inside this period."
          : null,
        skills.length > 0 ? `Skills to attach: ${skills.join(", ")}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    );
    out.push(heading("Description", report));
    out.push(fence(block.description));
  });

  // Education
  out.push("## Education");
  out.push(
    fence(
      content.cv.education
        .map((entry) =>
          [
            entry.title[lang],
            `${entry.organization} · ${formatPeriod(entry, presentLabel)}`,
          ].join("\n"),
        )
        .join("\n\n"),
    ),
  );

  // Skills
  const allSkills = orderSkills([
    ...content.cv.assignments,
    ...content.cv.roles,
  ]).slice(0, LIMITS.skills);
  out.push(`## Skills — ${allSkills.length} / ${LIMITS.skills}`);
  out.push(
    "Pin the first five to the top of the profile. LinkedIn suggests its own canonical name as you type (ReactJS → React), so accept its suggestion where the wording differs.",
  );
  out.push(fence(allSkills.join(", ")));

  // Unmatched — always present. Its absence would be indistinguishable from a
  // tool that silently dropped work.
  out.push("## Unmatched assignments");
  out.push(
    unmatched.length === 0
      ? "None."
      : unmatched
          .map(
            (a) =>
              `- ${a.id} — ${a.organization} (${formatPeriod(a, presentLabel)})`,
          )
          .join("\n"),
  );

  return { text: out.join("\n\n") + "\n", reports };
}

// --- Main ------------------------------------------------------------------

function main(): void {
  console.log("\n=== LinkedIn Build ===\n");

  console.log("Reading site content...");
  if (!existsSync(CONTENT_PATH)) {
    fail(
      "Missing public/content/site-content.json — run 'npm run content:build' first",
    );
  }
  const content: SiteContent = JSON.parse(readFileSync(CONTENT_PATH, "utf-8"));

  // Read and validate both languages before writing anything, so a broken
  // source file cannot leave one half-updated output file behind.
  console.log("Reading specs-input/linkedin/...");
  const copy: Record<Lang, LinkedInCopy> = {
    en: readLinkedInCopy("en"),
    sv: readLinkedInCopy("sv"),
  };

  const { roles, assignments } = content.cv;
  console.log(
    `Matching ${assignments.length} assignments to ${roles.length} positions...`,
  );
  const { byRole, unmatched } = matchAssignments(roles, assignments);

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  for (const file of readdirSync(OUTPUT_DIR)) {
    if (/^linkedin-.*\.md$/.test(file)) {
      unlinkSync(join(OUTPUT_DIR, file));
    }
  }

  const allReports: LimitReport[] = [];
  for (const lang of LANGS) {
    const name = `linkedin-${lang}.md`;
    console.log(`Generating ${name}...`);
    const { text, reports } = renderDocument(
      lang,
      content,
      copy[lang],
      byRole,
      unmatched,
    );
    writeFileSync(join(OUTPUT_DIR, name), text, "utf-8");
    allReports.push(...reports);
    console.log(`  ✓ ${name}`);
  }

  const exceeded = allReports.filter((r) => r.exceeded);
  if (exceeded.length > 0) {
    console.log("\n⚠ Over LinkedIn's limits (trim before pasting):");
    for (const report of exceeded) {
      console.log(
        `  [${report.lang}] ${report.label} — ${report.count} / ${report.limit} characters`,
      );
    }
  }

  console.log("\n✓ LinkedIn build complete!");
  console.log(`  Files generated: ${LANGS.length}`);
  console.log("  Output directory: linkedin/");
  console.log(`  Unmatched assignments: ${unmatched.length}`);
}

main();
