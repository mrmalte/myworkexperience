"use client";

import type { ReactNode } from "react";

interface HamburgerDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  activeLabel: string;
  children: ReactNode;
  ariaLabel?: string;
}

export function HamburgerDrawer({
  isOpen,
  onToggle,
  activeLabel,
  children,
  ariaLabel = "Menu",
}: HamburgerDrawerProps) {
  return (
    <>
      {/* Active label + hamburger button — visible only on mobile */}
      <span className="hidden max-[720px]:block ml-auto text-[0.78rem] font-medium text-accent font-instrument-sans">
        {activeLabel}
      </span>
      <button
        className="hidden max-[720px]:flex flex-col justify-center gap-[5px] w-[44px] h-[44px] bg-transparent border-none cursor-pointer p-2 shrink-0"
        onClick={onToggle}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
      >
        <span
          className={`block h-[1.5px] bg-cv-text rounded-sm transition-all duration-200 ${
            isOpen ? "translate-y-[3.25px] rotate-45" : ""
          }`}
        />
        <span
          className={`block h-[1.5px] bg-cv-text rounded-sm transition-all duration-200 ${
            isOpen ? "opacity-0" : ""
          }`}
        />
        <span
          className={`block h-[1.5px] bg-cv-text rounded-sm transition-all duration-200 ${
            isOpen ? "-translate-y-[3.25px] -rotate-45" : ""
          }`}
        />
      </button>

      {/* Slide-down drawer — overlays content */}
      <div
        className={`hidden max-[720px]:block absolute left-0 right-0 top-full bg-white border-b border-line z-[99] shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-[max-height] duration-300 ease-in-out overflow-hidden ${
          isOpen ? "max-h-[70vh] overflow-y-auto" : "max-h-0"
        }`}
      >
        <div className="px-4 pt-3 pb-4 flex flex-col gap-[0.15rem]">
          {children}
        </div>
      </div>
    </>
  );
}
