export type Language = "en" | "sv";

export const LANGUAGES: Language[] = ["en", "sv"];

export const DEFAULT_LANGUAGE: Language = "en";

export function isValidLanguage(lang: string): lang is Language {
  return LANGUAGES.includes(lang as Language);
}

export function validateLanguage(lang: string): Language {
  if (!isValidLanguage(lang)) {
    throw new Error(`Invalid language: ${lang}. Must be 'en' or 'sv'`);
  }
  return lang;
}
