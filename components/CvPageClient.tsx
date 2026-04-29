"use client";

import { useState } from "react";
import { CvSections } from "@/components/CvSections";
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
  showMoreSummary: LocalizedText;
  noResults: LocalizedText;
  present: LocalizedText;
}

interface CvPageClientProps {
  lang: Language;
  summary: LocalizedText;
  education: CVEntry[];
  roles: CVEntry[];
  assignments: CVEntry[];
  uiCv: UiCv;
  uiNavCv: LocalizedText;
}

export function CvPageClient({
  lang,
  summary,
  education,
  roles,
  assignments,
  uiCv,
  uiNavCv,
}: CvPageClientProps) {
  const [query, setQuery] = useState("");
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  return (
    <div>
      {/* Page title */}
      <h1 className="sr-only">{uiNavCv[lang]}</h1>

      {/* Summary */}
      <p
        className={`font-fraunces text-lg max-[720px]:text-[0.9rem] text-cv-text leading-relaxed mb-6 whitespace-pre-wrap${
          !summaryExpanded
            ? " max-[720px]:line-clamp-3 max-[720px]:whitespace-normal"
            : ""
        }`}
      >
        {summary[lang]}
      </p>
      {!summaryExpanded && (
        <button
          onClick={() => setSummaryExpanded(true)}
          className="hidden max-[720px]:inline-block -mt-4 mb-4 text-[0.78rem] font-semibold text-accent font-instrument-sans cursor-pointer"
        >
          {uiCv.showMoreSummary[lang]}
        </button>
      )}

      {/* Search bar — below summary, above lists */}
      <div className="py-4">
        <div className="flex items-center gap-[0.6rem] bg-off border-[1.5px] border-line rounded-[8px] px-4 py-[0.6rem] transition-all duration-200 focus-within:bg-white focus-within:border-accent focus-within:shadow-[0_0_0_3px_#e8f3ee]">
          {/* Search icon */}
          <svg
            className="text-mid flex-shrink-0"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={uiCv.searchPlaceholder[lang]}
            className="w-full bg-transparent border-none outline-none text-[0.88rem] max-[720px]:text-[16px] text-cv-text placeholder-[#b0a89e] font-instrument-sans"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label={uiCv.clearSearch[lang]}
              className="text-mid hover:text-cv-text flex-shrink-0 leading-none"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* CV list sections */}
      <CvSections
        lang={lang}
        education={education}
        roles={roles}
        assignments={assignments}
        filterQuery={query}
        uiCv={uiCv}
      />
    </div>
  );
}
