import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

export interface ParsedMeta {
  [key: string]: string;
}

export interface ParsedContent {
  title: string;
  description: string;
}

export interface ParsedEntry {
  id: string;
  meta: ParsedMeta;
  en: ParsedContent;
  sv: ParsedContent;
}

const ALLOWED_TYPES = [
  "education",
  "employee",
  "consultant",
  "voluntary",
  "national",
  "assignment",
];
const ALLOWED_LOCATION_TYPES = ["onsite", "hybrid", "remote"];

export function parseSource(dataDir: string): {
  summary: ParsedEntry | null;
  experiences: ParsedEntry[];
  experienceSummaries: ParsedEntry[];
  about: { en: string; sv: string };
} {
  const cvDir = join(dataDir, "cv");
  const aboutDir = join(dataDir, "about");

  const entries = readdirSync(cvDir).filter((name) => {
    const path = join(cvDir, name);
    return statSync(path).isDirectory();
  });

  let summary: ParsedEntry | null = null;
  const experiences: ParsedEntry[] = [];
  const experienceSummaries: ParsedEntry[] = [];

  for (const dirName of entries) {
    const dirPath = join(cvDir, dirName);

    // Determine directory type
    let dirType: "summary" | "experience" | "experience_summary" | null = null;
    if (dirName === "summary") {
      dirType = "summary";
    } else if (/^\d{6}_.+_summary$/.test(dirName)) {
      dirType = "experience_summary";
    } else if (/^\d{6}_.+$/.test(dirName)) {
      dirType = "experience";
    }

    if (!dirType) {
      throw new Error(`Invalid directory name: ${dirName}`);
    }

    // Parse entry
    const entry = parseEntry(dirPath, dirName, dirType);

    if (dirType === "summary") {
      summary = entry;
    } else if (dirType === "experience") {
      experiences.push(entry);
    } else {
      experienceSummaries.push(entry);
    }
  }

  if (!summary) {
    throw new Error("Missing required summary/ directory in specs-input/cv");
  }

  // Parse about text
  const aboutEn = readFileSync(join(aboutDir, "en.txt"), "utf-8").trim();
  const aboutSv = readFileSync(join(aboutDir, "sv.txt"), "utf-8").trim();

  return {
    summary,
    experiences,
    experienceSummaries,
    about: { en: aboutEn, sv: aboutSv },
  };
}

function parseEntry(
  dirPath: string,
  dirName: string,
  dirType: string
): ParsedEntry {
  const metaPath = join(dirPath, "meta.txt");
  const enPath = join(dirPath, "en.txt");
  const svPath = join(dirPath, "sv.txt");

  // Check required files exist
  try {
    statSync(metaPath);
  } catch {
    throw new Error(`Missing meta.txt in ${dirName}`);
  }
  try {
    statSync(enPath);
  } catch {
    throw new Error(`Missing en.txt in ${dirName}`);
  }
  try {
    statSync(svPath);
  } catch {
    throw new Error(`Missing sv.txt in ${dirName}`);
  }

  const meta = parseMeta(metaPath, dirName, dirType);
  const en = parseContent(enPath, dirName);
  const sv = parseContent(svPath, dirName);

  return {
    id: dirName,
    meta,
    en,
    sv,
  };
}

function parseMeta(
  metaPath: string,
  dirName: string,
  dirType: string
): ParsedMeta {
  const text = readFileSync(metaPath, "utf-8");
  const lines = text.split("\n");
  const meta: ParsedMeta = {};
  const seenKeys = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (!line.includes(":")) {
      throw new Error(
        `${dirName}/meta.txt line ${i + 1}: missing ':' separator`
      );
    }

    const colonIndex = line.indexOf(":");
    const key = line.substring(0, colonIndex).trim();
    const value = line.substring(colonIndex + 1).trim();

    if (!key) {
      throw new Error(`${dirName}/meta.txt line ${i + 1}: empty key`);
    }

    const keyLower = key.toLowerCase();
    if (seenKeys.has(keyLower)) {
      throw new Error(`${dirName}/meta.txt: duplicate key '${key}'`);
    }
    seenKeys.add(keyLower);

    meta[keyLower] = value;
  }

  // Validate required keys based on directory type
  if (dirType === "summary") {
    if (!meta.role) {
      throw new Error(`${dirName}/meta.txt: missing required key 'Role'`);
    }
  } else if (dirType === "experience") {
    const required = [
      "type",
      "organization",
      "period",
      "role",
      "location",
      "locationtype",
    ];
    for (const req of required) {
      if (!meta[req]) {
        throw new Error(`${dirName}/meta.txt: missing required key '${req}'`);
      }
    }

    // Validate type
    const typeLower = meta.type.toLowerCase();
    if (!ALLOWED_TYPES.includes(typeLower)) {
      throw new Error(`${dirName}/meta.txt: invalid Type '${meta.type}'`);
    }

    // Validate client rules
    if (typeLower === "assignment") {
      if (!meta.client || !meta.client.trim()) {
        throw new Error(
          `${dirName}/meta.txt: Client is required when Type is assignment`
        );
      }
    } else if (meta.client) {
      throw new Error(
        `${dirName}/meta.txt: Client not allowed unless Type is assignment`
      );
    }

    // Validate locationtype
    const locationTypeLower = meta.locationtype.toLowerCase();
    if (!ALLOWED_LOCATION_TYPES.includes(locationTypeLower)) {
      throw new Error(
        `${dirName}/meta.txt: invalid LocationType '${meta.locationtype}'`
      );
    }

    // Validate period format
    validatePeriod(meta.period, dirName);
  } else if (dirType === "experience_summary") {
    const required = [
      "type",
      "organization",
      "period",
      "role",
      "location",
      "locationtype",
    ];
    for (const req of required) {
      if (!meta[req]) {
        throw new Error(`${dirName}/meta.txt: missing required key '${req}'`);
      }
    }

    const typeLower = meta.type.toLowerCase();
    if (!ALLOWED_TYPES.includes(typeLower)) {
      throw new Error(`${dirName}/meta.txt: invalid Type '${meta.type}'`);
    }
    if (typeLower === "assignment") {
      throw new Error(
        `${dirName}/meta.txt: Type 'assignment' not allowed in *_summary directory`
      );
    }
    if (meta.client) {
      throw new Error(
        `${dirName}/meta.txt: Client not allowed in *_summary directory`
      );
    }

    const locationTypeLower = meta.locationtype.toLowerCase();
    if (!ALLOWED_LOCATION_TYPES.includes(locationTypeLower)) {
      throw new Error(
        `${dirName}/meta.txt: invalid LocationType '${meta.locationtype}'`
      );
    }

    validatePeriod(meta.period, dirName);
  }

  return meta;
}

function validatePeriod(period: string, dirName: string): void {
  // YYYY format
  if (/^\d{4}$/.test(period)) {
    return;
  }

  // YYYYMM- format (ongoing)
  if (/^\d{6}-$/.test(period)) {
    const yyyymm = period.substring(0, 6);
    if (!isValidYYYYMM(yyyymm)) {
      throw new Error(`${dirName}/meta.txt: invalid Period '${period}'`);
    }
    return;
  }

  // YYYYMM-YYYYMM format
  if (/^\d{6}-\d{6}$/.test(period)) {
    const [from, to] = period.split("-");
    if (!isValidYYYYMM(from) || !isValidYYYYMM(to)) {
      throw new Error(`${dirName}/meta.txt: invalid Period '${period}'`);
    }
    if (to < from) {
      throw new Error(
        `${dirName}/meta.txt: invalid Period '${period}' (end before start)`
      );
    }
    return;
  }

  throw new Error(`${dirName}/meta.txt: invalid Period format '${period}'`);
}

function isValidYYYYMM(yyyymm: string): boolean {
  if (!/^\d{6}$/.test(yyyymm)) return false;
  const year = parseInt(yyyymm.substring(0, 4));
  const month = parseInt(yyyymm.substring(4, 6));
  return year >= 1900 && year <= 2100 && month >= 1 && month <= 12;
}

function parseContent(contentPath: string, dirName: string): ParsedContent {
  const text = readFileSync(contentPath, "utf-8");
  const lines = text.split("\n");

  // Find first non-empty line
  let firstNonEmpty = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim()) {
      firstNonEmpty = i;
      break;
    }
  }

  if (firstNonEmpty === -1) {
    throw new Error(
      `${dirName}/${contentPath.split("/").pop()}: file is empty`
    );
  }

  const firstLine = lines[firstNonEmpty].trim();
  const titleMatch = /^title\s*:\s*(.+)$/i.exec(firstLine);

  if (!titleMatch) {
    throw new Error(
      `${dirName}/${contentPath
        .split("/")
        .pop()}: first non-empty line must be 'Title: ...' (got '${firstLine}')`
    );
  }

  const title = titleMatch[1].trim();
  if (!title) {
    throw new Error(
      `${dirName}/${contentPath
        .split("/")
        .pop()}: Title value must be non-empty`
    );
  }

  // Everything after the title line is description
  const descriptionLines = lines.slice(firstNonEmpty + 1);
  let description = descriptionLines.join("\n").trim();

  // Handle optional Description: prefix
  const descMatch = /^description\s*:\s*/i.exec(description);
  if (descMatch) {
    description = description.substring(descMatch[0].length).trim();
  }

  return { title, description };
}
