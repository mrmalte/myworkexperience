#!/usr/bin/env tsx
import { writeFileSync, readFileSync } from "fs";
import { join } from "path";
import { parseSource } from "./content/parseSource.js";

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

interface UIStrings {
  nav: {
    cv: LocalizedText;
    technologies: LocalizedText;
    about: LocalizedText;
    contact: LocalizedText;
  };
  cv: {
    sections: {
      education: LocalizedText;
      roles: LocalizedText;
      assignments: LocalizedText;
    };
    searchPlaceholder: LocalizedText;
    clearSearch: LocalizedText;
    showAll: LocalizedText;
    showMoreSummary: LocalizedText;
    noResults: LocalizedText;
    present: LocalizedText;
  };
  contact: {
    intro: LocalizedText;
    fields: {
      name: LocalizedText;
      email: LocalizedText;
      subject: LocalizedText;
      message: LocalizedText;
    };
    submit: LocalizedText;
    success: LocalizedText;
    error: LocalizedText;
    sending: LocalizedText;
    validation: {
      required: LocalizedText;
      email: LocalizedText;
    };
  };
  meta: {
    title: LocalizedText;
    description: LocalizedText;
  };
  notFound: {
    homeLink: LocalizedText;
  };
  technologies: {
    allCategory: LocalizedText;
    sortTime: LocalizedText;
    sortAlpha: LocalizedText;
    yearsLessThanOne: LocalizedText;
    yearsOne: LocalizedText;
    yearsSuffix: LocalizedText;
  };
}

interface TechItem {
  name: string;
  years: number;
}

interface SiteContent {
  schemaVersion: string;
  generatedAt: string;
  person: {
    name: string;
    role: string;
  };
  about: {
    text: LocalizedText;
  };
  notFound: {
    title: LocalizedText;
    text: LocalizedText;
  };
  technologies: Record<string, TechItem[]>;
  cv: {
    summary: LocalizedText;
    education: CVEntry[];
    roles: CVEntry[];
    assignments: CVEntry[];
  };
  ui: UIStrings;
}

function main() {
  const dataDir = join(process.cwd(), "specs-input");
  const outputPath = join(process.cwd(), "public/content/site-content.json");

  console.log("Parsing source data...");
  const parsed = parseSource(dataDir);

  console.log("Generating site content...");

  // Read tech categories for technologies map
  const techCategoriesRaw: Record<string, string[]> = JSON.parse(
    readFileSync(join(dataDir, "tech-categories.json"), "utf-8"),
  );

  // Read not-found text
  const notFoundEn = readFileSync(
    join(dataDir, "not-found/en.txt"),
    "utf-8",
  ).trim();
  const notFoundSv = readFileSync(
    join(dataDir, "not-found/sv.txt"),
    "utf-8",
  ).trim();

  // Build CV entries
  const allEntries = [...parsed.experiences, ...parsed.experienceSummaries];
  const cvEntries: CVEntry[] = allEntries.map((entry) => {
    const type = entry.meta.type.toLowerCase();
    const period = parsePeriod(entry.meta.period);

    return {
      id: entry.id,
      type,
      period,
      sortKey: period.start, // Use start for sorting
      organization: entry.meta.organization,
      client: type === "assignment" ? entry.meta.client || null : null,
      role: entry.meta.role,
      location: entry.meta.location,
      locationType: entry.meta.locationtype.toLowerCase(),
      title: {
        en: entry.en.title,
        sv: entry.sv.title,
      },
      description: {
        en: entry.en.description,
        sv: entry.sv.description,
      },
      technologies: entry.meta.technologies
        ? entry.meta.technologies
            .split(",")
            .map((t: string) => t.trim())
            .filter(Boolean)
        : [],
    };
  });

  // Sort by sortKey (newest first)
  cvEntries.sort((a, b) => b.sortKey.localeCompare(a.sortKey));

  // Partition by type
  const education = cvEntries.filter((e) => e.type === "education");
  const roles = cvEntries.filter((e) =>
    ["employee", "consultant", "voluntary", "national"].includes(e.type),
  );
  const assignments = cvEntries.filter((e) => e.type === "assignment");

  // Compute technologies map with years per FR-037
  // Build case-insensitive lookup: lowercase tech → { category, canonical }
  const techLookup = new Map<string, { category: string; canonical: string }>();
  for (const [cat, techs] of Object.entries(techCategoriesRaw)) {
    for (const t of techs) {
      techLookup.set(t.toLowerCase(), { category: cat, canonical: t });
    }
  }

  // Collect all used technologies and sum raw months per technology
  const techMonthsMap = new Map<string, number>(); // lowercase → total months
  const techCanonicalMap = new Map<string, string>(); // lowercase → canonical name
  const buildDate = new Date();

  for (const entry of allEntries) {
    const techsRaw: string = entry.meta.technologies ?? "";
    const techNames = techsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (techNames.length === 0) continue;

    // Compute entry duration in months
    const period = parsePeriod(entry.meta.period);
    const startDate = periodToDate(period.start);
    const endDate = period.end ? periodToDate(period.end) : buildDate;
    const months = Math.max(
      0,
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        (endDate.getMonth() - startDate.getMonth()),
    );

    for (const t of techNames) {
      const lower = t.toLowerCase();
      techMonthsMap.set(lower, (techMonthsMap.get(lower) ?? 0) + months);
      if (!techCanonicalMap.has(lower)) {
        const found = techLookup.get(lower);
        techCanonicalMap.set(lower, found?.canonical ?? t);
      }
    }
  }

  // Assign each used tech to a category with computed years
  const categoryBuckets = new Map<string, TechItem[]>();
  for (const [lowerName] of techMonthsMap) {
    const found = techLookup.get(lowerName);
    const cat = found?.category ?? "Other";
    const canonical = techCanonicalMap.get(lowerName)!;
    const totalMonths = techMonthsMap.get(lowerName)!;
    const years = Math.round(totalMonths / 12);
    if (!categoryBuckets.has(cat)) {
      categoryBuckets.set(cat, []);
    }
    categoryBuckets.get(cat)!.push({ name: canonical, years });
  }

  // Build ordered output, preserving tech-categories.json category order
  const technologies: Record<string, TechItem[]> = {};
  for (const cat of Object.keys(techCategoriesRaw)) {
    const techs = categoryBuckets.get(cat);
    if (techs && techs.length > 0) {
      technologies[cat] = techs
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name));
    }
  }
  // Handle uncategorized "Other" if it wasn't already included via the lookup
  if (categoryBuckets.has("Other") && !technologies["Other"]) {
    technologies["Other"] = categoryBuckets
      .get("Other")!
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  // Ensure summary exists
  if (!parsed.summary) {
    throw new Error(
      "Summary entry is required but not found in specs-input/cv/summary/",
    );
  }

  const content: SiteContent = {
    schemaVersion: "1",
    generatedAt: new Date().toISOString(),
    person: {
      name: "Malte Särner",
      role: parsed.summary.meta.role,
    },
    about: {
      text: {
        en: parsed.about.en,
        sv: parsed.about.sv,
      },
    },
    notFound: {
      title: {
        en: "Page not found",
        sv: "Sidan hittades inte",
      },
      text: {
        en: notFoundEn,
        sv: notFoundSv,
      },
    },
    technologies,
    cv: {
      summary: {
        en: parsed.summary.en.description,
        sv: parsed.summary.sv.description,
      },
      education,
      roles,
      assignments,
    },
    ui: {
      nav: {
        cv: { en: "CV", sv: "CV" },
        technologies: { en: "Technologies", sv: "Teknologier" },
        about: { en: "About", sv: "Om" },
        contact: { en: "Contact", sv: "Kontakt" },
      },
      cv: {
        sections: {
          education: { en: "Education", sv: "Utbildning" },
          roles: { en: "Positions", sv: "Positioner" },
          assignments: { en: "Assignments", sv: "Uppdrag" },
        },
        searchPlaceholder: { en: "Search\u2026", sv: "Sök\u2026" },
        clearSearch: { en: "Clear search", sv: "Rensa sökning" },
        showAll: { en: "Show all", sv: "Visa alla" },
        showMoreSummary: { en: "Show all", sv: "Visa mer" },
        noResults: { en: "No results", sv: "Inga resultat" },
        present: { en: "present", sv: "Nuvarande" },
      },
      contact: {
        intro: {
          en: "Send me a message using the form below.",
          sv: "Skicka ett meddelande via formuläret nedan.",
        },
        fields: {
          name: { en: "Name", sv: "Namn" },
          email: { en: "Email", sv: "E-post" },
          subject: { en: "Subject", sv: "Ämne" },
          message: { en: "Message", sv: "Meddelande" },
        },
        submit: { en: "Send Message", sv: "Skicka meddelande" },
        success: {
          en: "Thank you — your message has been sent.",
          sv: "Tack — ditt meddelande har skickats.",
        },
        error: {
          en: "Please fill in all required fields.",
          sv: "Vänligen fyll i alla obligatoriska fält.",
        },
        sending: {
          en: "Sending\u2026",
          sv: "Skickar\u2026",
        },
        validation: {
          required: {
            en: "This field is required",
            sv: "Detta fält är obligatoriskt",
          },
          email: {
            en: "Please enter a valid email address",
            sv: "Vänligen ange en giltig e-postadress",
          },
        },
      },
      meta: {
        title: { en: "Malte Särner - CV", sv: "Malte Särner - CV" },
        description: { en: "Malte Särners CV", sv: "Malte Särners CV" },
      },
      notFound: {
        homeLink: { en: "Go to home page", sv: "Gå till startsidan" },
      },
      technologies: {
        allCategory: { en: "All", sv: "Alla" },
        sortTime: { en: "Time", sv: "Tid" },
        sortAlpha: { en: "A\u2013Z", sv: "A\u2013Ö" },
        yearsLessThanOne: { en: "< 1 yr", sv: "< 1 år" },
        yearsOne: { en: "1 yr", sv: "1 år" },
        yearsSuffix: { en: "yrs", sv: "år" },
      },
    },
  };

  console.log("Writing output...");
  console.log("⚠️  DO NOT EDIT: site-content.json is a generated artifact");
  writeFileSync(outputPath, JSON.stringify(content, null, 2), "utf-8");
  console.log(`✓ Generated: ${outputPath}`);
  console.log(`  Education: ${education.length}`);
  console.log(`  Roles: ${roles.length}`);
  console.log(`  Assignments: ${assignments.length}`);
}

function periodToDate(period: string): Date {
  if (period.length === 4) {
    // YYYY format — treat as January of that year
    return new Date(parseInt(period, 10), 0, 1);
  }
  const y = parseInt(period.substring(0, 4), 10);
  const m = parseInt(period.substring(4, 6), 10) - 1; // 0-indexed
  return new Date(y, m, 1);
}

function parsePeriod(periodRaw: string): {
  raw: string;
  start: string;
  end: string | null;
} {
  // YYYY format
  if (/^\d{4}$/.test(periodRaw)) {
    return {
      raw: periodRaw,
      start: periodRaw,
      end: periodRaw,
    };
  }

  // YYYYMM- format (ongoing)
  if (/^\d{6}-$/.test(periodRaw)) {
    const start = periodRaw.substring(0, 6);
    return {
      raw: periodRaw,
      start,
      end: null,
    };
  }

  // YYYYMM-YYYYMM format
  if (/^\d{6}-\d{6}$/.test(periodRaw)) {
    const [start, end] = periodRaw.split("-");
    return {
      raw: periodRaw,
      start,
      end,
    };
  }

  throw new Error(`Invalid period format: ${periodRaw}`);
}

main();
