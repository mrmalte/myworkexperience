import { loadContent } from "@/lib/content/loadContent";
import type { Language } from "@/lib/i18n/lang";
import TechChart from "@/components/TechChart";

interface TechnologiesPageProps {
  params: Promise<{ lang: string }>;
}

export default async function TechnologiesPage({
  params,
}: TechnologiesPageProps) {
  const { lang } = await params;
  const content = loadContent();
  const l = lang as Language;

  return (
    <div className="space-y-10">
      <h1 className="sr-only">{content.ui.nav.technologies[l]}</h1>
      <TechChart
        technologies={content.technologies}
        lang={l}
        uiTechnologies={content.ui.technologies}
      />
    </div>
  );
}
