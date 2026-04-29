import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { LANGUAGES, type Language } from "@/lib/i18n/lang";
import { loadContent } from "@/lib/content/loadContent";

export function generateStaticParams() {
  return LANGUAGES.map((lang) => ({ lang }));
}

interface LanguageLayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

export default async function LanguageLayout({
  children,
  params,
}: LanguageLayoutProps) {
  const { lang } = await params;

  if (!LANGUAGES.includes(lang as Language)) {
    notFound();
  }

  return (
    <>
      <Header lang={lang as Language} />
      <main className="max-w-[900px] mx-auto px-8 py-8 max-[720px]:px-4">
        {children}
      </main>
    </>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const content = loadContent();
  const l = lang as Language;
  return {
    title: content.ui.meta.title[l],
    description: content.ui.meta.description[l],
  };
}
