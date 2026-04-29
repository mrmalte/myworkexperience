"use client";

import { useState } from "react";
import type { Language } from "@/lib/i18n/lang";
import type { CVEntry, LocalizedText } from "@/lib/content/loadContent";

interface UiCv {
  sections: {
    education: LocalizedText;
    roles: LocalizedText;
    assignments: LocalizedText;
  };
  searchPlaceholder: LocalizedText;
  clearSearch: LocalizedText;
  showAll: LocalizedText;
  noResults: LocalizedText;
  present: LocalizedText;
}

interface CvSectionsProps {
  lang: Language;
  education: CVEntry[];
  roles: CVEntry[];
  assignments: CVEntry[];
  filterQuery?: string;
  uiCv: UiCv;
}

export function CvSections({
  lang,
  education,
  roles,
  assignments,
  filterQuery = "",
  uiCv,
}: CvSectionsProps) {
  return (
    <div className="space-y-14 max-[720px]:space-y-10">
      {/* Education Section */}
      <section>
        <h2 className="font-fraunces text-[1.25rem] font-semibold tracking-[-0.02em] text-cv-text mb-6">
          {uiCv.sections.education[lang]}
        </h2>
        <CvList
          items={education}
          lang={lang}
          filterQuery={filterQuery}
          uiCv={uiCv}
        />
      </section>

      {/* Roles Section */}
      <section>
        <h2 className="font-fraunces text-[1.25rem] font-semibold tracking-[-0.02em] text-cv-text mb-6">
          {uiCv.sections.roles[lang]}
        </h2>
        <CvList
          items={roles}
          lang={lang}
          useRole
          filterQuery={filterQuery}
          uiCv={uiCv}
        />
      </section>

      {/* Assignments Section */}
      <section>
        <h2 className="font-fraunces text-[1.25rem] font-semibold tracking-[-0.02em] text-cv-text mb-6">
          {uiCv.sections.assignments[lang]}
        </h2>
        <CvList
          items={assignments}
          lang={lang}
          filterQuery={filterQuery}
          uiCv={uiCv}
        />
      </section>
    </div>
  );
}

interface CvListProps {
  items: CVEntry[];
  lang: Language;
  useRole?: boolean;
  filterQuery?: string;
  uiCv: UiCv;
}

function formatPeriod(period: CVEntry["period"], presentLabel: string): string {
  if (period.end) {
    return period.raw;
  }
  if (period.raw.endsWith("-")) {
    return `${period.raw}${presentLabel}`;
  }
  return `${period.start}-${presentLabel}`;
}

function matchesQuery(
  item: CVEntry,
  lang: Language,
  presentLabel: string,
  words: string[],
): boolean {
  if (words.length === 0) return true;
  const hay = [
    formatPeriod(item.period, presentLabel),
    item.role,
    item.title[lang],
    item.organization,
    item.client ?? "",
    item.location,
    item.description[lang],
    item.technologies.join(" "),
  ]
    .join(" ")
    .toLowerCase();
  return words.every((w) => hay.includes(w));
}

function CvList({
  items,
  lang,
  useRole = false,
  filterQuery = "",
  uiCv,
}: CvListProps) {
  const [showAll, setShowAll] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const presentLabel = uiCv.present[lang];

  const queryWords = filterQuery
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  const isFiltering = queryWords.length > 0;

  const filteredItems = isFiltering
    ? items.filter((item) => matchesQuery(item, lang, presentLabel, queryWords))
    : items;

  const displayItems =
    isFiltering || showAll ? filteredItems : filteredItems.slice(0, 5);
  const hasMore = !isFiltering && filteredItems.length > 5;

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div>
      {isFiltering && filteredItems.length === 0 && (
        <p className="text-sm text-mid italic font-instrument-sans">
          {uiCv.noResults[lang]}
        </p>
      )}
      {filteredItems.length > 0 && (
        <>
          <div>
            {displayItems.map((item) => {
              const isExpanded = expandedIds.has(item.id);
              const itemLabel = useRole ? item.role : item.title[lang];
              const period =
                item.type === "education"
                  ? (item.period.end?.slice(0, 4) ??
                    item.period.start.slice(0, 4))
                  : formatPeriod(item.period, presentLabel);

              return (
                <div
                  key={item.id}
                  className="py-[1.25rem] border-b border-line first:border-t first:border-line cursor-pointer"
                  onClick={() => toggleExpand(item.id)}
                >
                  <div className="flex items-baseline justify-between gap-4 max-[720px]:flex-wrap">
                    <span className="font-semibold text-[0.95rem] text-cv-text font-instrument-sans">
                      {itemLabel}
                    </span>
                    <span className="text-[0.72rem] text-mid whitespace-nowrap flex-shrink-0 font-instrument-sans tabular-nums max-[720px]:basis-full max-[720px]:order-[-1]">
                      {period}
                    </span>
                  </div>
                  <div className="text-[0.78rem] text-mid mt-[0.2rem] font-instrument-sans">
                    {item.organization}
                    {item.client && ` · ${item.client}`}
                    {` · ${item.location}`}
                  </div>
                  {isExpanded && (
                    <div className="mt-[0.8rem] text-[0.85rem] text-[#4a4640] leading-[1.75] font-instrument-sans space-y-3">
                      {item.description[lang]
                        .split("\n")
                        .filter((line) => line.trim())
                        .map((line, i) => (
                          <p key={i}>{line}</p>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {hasMore && !showAll && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAll(true);
              }}
              className="mt-3 text-[0.72rem] font-semibold text-accent font-instrument-sans cursor-pointer"
            >
              {uiCv.showAll[lang]} ({items.length})
            </button>
          )}
        </>
      )}
    </div>
  );
}
