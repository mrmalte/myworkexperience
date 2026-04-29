"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Language } from "@/lib/i18n/lang";
import type { LocalizedText } from "@/lib/content/loadContent";
import { HamburgerDrawer } from "./HamburgerDrawer";

interface MenuProps {
  lang: Language;
  personName: string;
  personRole: string;
  navLabels: {
    cv: LocalizedText;
    technologies: LocalizedText;
    about: LocalizedText;
    contact: LocalizedText;
  };
}

export function Menu({ lang, personName, personRole, navLabels }: MenuProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const currentPage = pathname.includes("/technologies")
    ? "technologies"
    : pathname.includes("/about")
      ? "about"
      : pathname.includes("/contact")
        ? "contact"
        : "cv";

  const otherLang: Language = lang === "en" ? "sv" : "en";

  // Build language switch URL: replace /en/ with /sv/ or vice-versa
  const languageSwitchPath = pathname.replace(
    new RegExp(`^\/${lang}(\/|$)`),
    `/${otherLang}$1`,
  );

  const navLinks: {
    key: "cv" | "technologies" | "about" | "contact";
    label: string;
    href: string;
  }[] = [
    { key: "cv", label: navLabels.cv[lang], href: `/${lang}/` },
    {
      key: "technologies",
      label: navLabels.technologies[lang],
      href: `/${lang}/technologies`,
    },
    {
      key: "about",
      label: navLabels.about[lang],
      href: `/${lang}/about`,
    },
    {
      key: "contact",
      label: navLabels.contact[lang],
      href: `/${lang}/contact`,
    },
  ];

  const activeLabel = navLinks.find((l) => l.key === currentPage)?.label ?? "";

  const toggleDrawer = useCallback(() => setDrawerOpen((o) => !o), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  /* Shared language toggle renderer */
  const langToggle = (mobile?: boolean) => (
    <div
      className={`flex border border-line rounded-[6px] overflow-hidden flex-shrink-0${
        mobile ? " min-h-[44px] self-start" : ""
      }`}
    >
      {(["en", "sv"] as Language[]).map((l) => (
        <Link
          key={l}
          href={l === lang ? "#" : languageSwitchPath}
          aria-current={l === lang ? "true" : undefined}
          onClick={mobile ? closeDrawer : undefined}
          className={
            l === lang
              ? `text-[0.7rem] font-semibold tracking-[0.04em] font-instrument-sans px-[0.6rem] py-[0.28rem] bg-cv-text text-white transition-all duration-150 pointer-events-none${mobile ? " flex items-center justify-center min-h-[44px]" : ""}`
              : `text-[0.7rem] font-semibold tracking-[0.04em] font-instrument-sans px-[0.6rem] py-[0.28rem] bg-transparent text-mid hover:bg-off transition-all duration-150${mobile ? " flex items-center justify-center min-h-[44px]" : ""}`
          }
        >
          {l.toUpperCase()}
        </Link>
      ))}
    </div>
  );

  return (
    <header className="sticky top-0 z-[100] bg-white/[0.96] backdrop-blur-sm border-b border-line">
      <div className="max-w-[900px] mx-auto px-8 max-[720px]:px-4 flex items-center justify-between h-[72px] max-[720px]:h-[56px]">
        {/* Left: name-block */}
        <div className="flex flex-col justify-center gap-[0.1rem] mr-auto">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.15em] text-accent font-instrument-sans">
            {personRole}
          </p>
          <p className="font-fraunces text-[1.35rem] font-semibold text-cv-text leading-none tracking-[-0.02em]">
            {personName}
          </p>
        </div>

        {/* Desktop: page links + language selector (hidden on mobile) */}
        <div className="flex items-center gap-4 max-[720px]:hidden">
          <nav className="flex items-center gap-[0.15rem]">
            {navLinks.map(({ key, label, href }) => (
              <Link
                key={key}
                href={href}
                className={
                  currentPage === key
                    ? "text-[0.78rem] font-medium font-instrument-sans px-[0.7rem] py-[0.35rem] rounded-[4px] text-accent bg-accent-light transition-all duration-150"
                    : "text-[0.78rem] font-medium font-instrument-sans px-[0.7rem] py-[0.35rem] rounded-[4px] text-mid hover:text-cv-text hover:bg-off transition-all duration-150"
                }
              >
                {label}
              </Link>
            ))}
          </nav>

          {langToggle()}
        </div>

        {/* Mobile: hamburger + drawer (hidden on desktop) */}
        <HamburgerDrawer
          isOpen={drawerOpen}
          onToggle={toggleDrawer}
          activeLabel={activeLabel}
          ariaLabel="Navigation menu"
        >
          {/* Language toggle at top of drawer */}
          {langToggle(true)}

          {/* Nav links */}
          <nav className="flex flex-col gap-[0.15rem] mt-2">
            {navLinks.map(({ key, label, href }) => (
              <Link
                key={key}
                href={href}
                onClick={closeDrawer}
                className={
                  currentPage === key
                    ? "text-[0.9rem] font-medium font-instrument-sans min-h-[44px] flex items-center px-[0.75rem] py-[0.65rem] rounded-[4px] text-accent bg-accent-light transition-all duration-150"
                    : "text-[0.9rem] font-medium font-instrument-sans min-h-[44px] flex items-center px-[0.75rem] py-[0.65rem] rounded-[4px] text-mid hover:text-cv-text hover:bg-off transition-all duration-150"
                }
              >
                {label}
              </Link>
            ))}
          </nav>
        </HamburgerDrawer>
      </div>
    </header>
  );
}
