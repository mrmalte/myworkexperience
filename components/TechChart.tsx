"use client";

import { useState, useCallback } from "react";
import type { TechItem, LocalizedText } from "@/lib/content/loadContent";
import type { Language } from "@/lib/i18n/lang";
import { HamburgerDrawer } from "./HamburgerDrawer";

interface UiTechnologies {
  allCategory: LocalizedText;
  sortTime: LocalizedText;
  sortAlpha: LocalizedText;
  yearsLessThanOne: LocalizedText;
  yearsOne: LocalizedText;
  yearsSuffix: LocalizedText;
}

interface TechChartProps {
  technologies: Record<string, TechItem[]>;
  lang: Language;
  uiTechnologies: UiTechnologies;
}

function barColor(years: number): string {
  if (years >= 12) return "#1a6b4a";
  if (years >= 7) return "#2d9b6f";
  if (years >= 3) return "#6bbea0";
  return "#a8d8c8";
}

export default function TechChart({
  technologies,
  lang,
  uiTechnologies,
}: TechChartProps) {
  const formatYears = (years: number): string => {
    if (years === 0) return uiTechnologies.yearsLessThanOne[lang];
    return years === 1
      ? uiTechnologies.yearsOne[lang]
      : `${years} ${uiTechnologies.yearsSuffix[lang]}`;
  };

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<"time" | "az">("time");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const toggleFilterDrawer = useCallback(
    () => setFilterDrawerOpen((o) => !o),
    [],
  );

  const categories = Object.keys(technologies);

  // Compute maxYears across ALL technologies (not filtered)
  const allItems = categories.flatMap((cat) => technologies[cat]);
  const maxYears = Math.max(...allItems.map((t) => t.years), 1);

  // Filter by active category
  const catsToShow = activeCategory ? [activeCategory] : categories;
  const rows = catsToShow.flatMap((cat) => technologies[cat] ?? []);

  // Sort
  const sorted = rows.slice().sort((a, b) => {
    if (sort === "az") return a.name.localeCompare(b.name);
    return b.years - a.years || a.name.localeCompare(b.name);
  });

  const activeCategoryLabel =
    activeCategory ?? uiTechnologies.allCategory[lang];

  return (
    <div>
      {/* Desktop filter row (hidden on mobile) */}
      <div className="flex flex-wrap gap-[0.25rem] mb-8 items-start max-[720px]:hidden">
        {/* Category buttons */}
        <button
          onClick={() => setActiveCategory(null)}
          className={`font-instrument-sans text-[0.78rem] font-medium px-[0.7rem] py-[0.35rem] rounded-[4px] border-none cursor-pointer transition-all duration-150 ${
            activeCategory === null
              ? "text-accent bg-accent-light"
              : "text-mid bg-transparent hover:text-cv-text hover:bg-off"
          }`}
        >
          {uiTechnologies.allCategory[lang]}
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() =>
              setActiveCategory(activeCategory === cat ? null : cat)
            }
            className={`font-instrument-sans text-[0.78rem] font-medium px-[0.7rem] py-[0.35rem] rounded-[4px] border-none cursor-pointer transition-all duration-150 ${
              activeCategory === cat
                ? "text-accent bg-accent-light"
                : "text-mid bg-transparent hover:text-cv-text hover:bg-off"
            }`}
          >
            {cat}
          </button>
        ))}

        {/* Sort toggle */}
        <div className="flex border border-line rounded-[6px] overflow-hidden shrink-0 ml-auto self-start">
          <button
            onClick={() => setSort("time")}
            className={`font-instrument-sans text-[0.7rem] font-semibold px-[0.65rem] py-[0.28rem] border-none cursor-pointer transition-all duration-150 tracking-[0.03em] whitespace-nowrap ${
              sort === "time"
                ? "bg-cv-text text-white"
                : "bg-transparent text-mid hover:bg-off"
            }`}
          >
            {uiTechnologies.sortTime[lang]}
          </button>
          <button
            onClick={() => setSort("az")}
            className={`font-instrument-sans text-[0.7rem] font-semibold px-[0.65rem] py-[0.28rem] border-none cursor-pointer transition-all duration-150 tracking-[0.03em] whitespace-nowrap ${
              sort === "az"
                ? "bg-cv-text text-white"
                : "bg-transparent text-mid hover:bg-off"
            }`}
          >
            {uiTechnologies.sortAlpha[lang]}
          </button>
        </div>
      </div>

      {/* Mobile filter bar with HamburgerDrawer (hidden on desktop) */}
      <div className="hidden max-[720px]:flex items-center relative mb-6">
        <HamburgerDrawer
          isOpen={filterDrawerOpen}
          onToggle={toggleFilterDrawer}
          activeLabel={activeCategoryLabel}
          ariaLabel="Filter menu"
        >
          {/* Sort toggle */}
          <div className="flex border border-line rounded-[6px] overflow-hidden self-start mb-2">
            <button
              onClick={() => {
                setSort("time");
                setFilterDrawerOpen(false);
              }}
              className={`font-instrument-sans text-[0.7rem] font-semibold min-h-[44px] px-[0.75rem] py-[0.65rem] border-none cursor-pointer transition-all duration-150 tracking-[0.03em] whitespace-nowrap ${
                sort === "time"
                  ? "bg-cv-text text-white"
                  : "bg-transparent text-mid hover:bg-off"
              }`}
            >
              {uiTechnologies.sortTime[lang]}
            </button>
            <button
              onClick={() => {
                setSort("az");
                setFilterDrawerOpen(false);
              }}
              className={`font-instrument-sans text-[0.7rem] font-semibold min-h-[44px] px-[0.75rem] py-[0.65rem] border-none cursor-pointer transition-all duration-150 tracking-[0.03em] whitespace-nowrap ${
                sort === "az"
                  ? "bg-cv-text text-white"
                  : "bg-transparent text-mid hover:bg-off"
              }`}
            >
              {uiTechnologies.sortAlpha[lang]}
            </button>
          </div>

          {/* Category buttons */}
          <div className="flex flex-col gap-[0.15rem]">
            <button
              onClick={() => {
                setActiveCategory(null);
                setFilterDrawerOpen(false);
              }}
              className={`font-instrument-sans text-[0.9rem] font-medium min-h-[44px] flex items-center px-[0.75rem] py-[0.65rem] rounded-[4px] border-none cursor-pointer transition-all duration-150 ${
                activeCategory === null
                  ? "text-accent bg-accent-light"
                  : "text-mid hover:text-cv-text hover:bg-off"
              }`}
            >
              {uiTechnologies.allCategory[lang]}
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(activeCategory === cat ? null : cat);
                  setFilterDrawerOpen(false);
                }}
                className={`font-instrument-sans text-[0.9rem] font-medium min-h-[44px] flex items-center px-[0.75rem] py-[0.65rem] rounded-[4px] border-none cursor-pointer transition-all duration-150 ${
                  activeCategory === cat
                    ? "text-accent bg-accent-light"
                    : "text-mid hover:text-cv-text hover:bg-off"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </HamburgerDrawer>
      </div>

      {/* Chart rows */}
      <div className="flex flex-col">
        {sorted.map((tech, i) => (
          <div
            key={tech.name}
            className={`flex items-center gap-3 py-[0.38rem] ${
              i < sorted.length - 1 ? "border-b border-off" : ""
            }`}
          >
            <div
              className="text-[0.85rem] max-[720px]:text-[0.78rem] text-cv-text w-[170px] max-[720px]:w-[110px] shrink-0 whitespace-nowrap overflow-hidden text-ellipsis"
              title={tech.name}
            >
              {tech.name}
            </div>
            <div className="flex-1 h-[6px] bg-off rounded-[3px] overflow-hidden">
              <div
                className="h-full rounded-[3px] transition-[width] duration-500 ease-[cubic-bezier(.4,0,.2,1)]"
                style={{
                  width: `${Math.round((tech.years / maxYears) * 100)}%`,
                  background: barColor(tech.years),
                }}
              />
            </div>
            <div className="text-[0.72rem] max-[720px]:text-[0.68rem] text-mid w-[38px] max-[720px]:w-[30px] text-right shrink-0 tabular-nums">
              {formatYears(tech.years)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
