import { loadContent } from "@/lib/content/loadContent";
import type { Language } from "@/lib/i18n/lang";

interface AboutPageProps {
  params: Promise<{ lang: string }>;
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { lang } = await params;
  const content = loadContent();
  const aboutText = content.about.text[lang as Language];

  return (
    <div>
      <h1 className="sr-only">{content.ui.nav.about[lang as Language]}</h1>
      <div className="prose max-w-none">
        <p
          className="whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: aboutText }}
        />
      </div>
    </div>
  );
}
