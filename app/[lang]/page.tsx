import { loadContent } from "@/lib/content/loadContent";
import { CvPageClient } from "@/components/CvPageClient";
import type { Language } from "@/lib/i18n/lang";

interface CvPageProps {
  params: Promise<{ lang: string }>;
}

export default async function CvPage({ params }: CvPageProps) {
  const { lang } = await params;
  const content = loadContent();
  const { summary, education, roles, assignments } = content.cv;

  return (
    <CvPageClient
      lang={lang as Language}
      summary={summary}
      education={education}
      roles={roles}
      assignments={assignments}
      uiCv={content.ui.cv}
      uiNavCv={content.ui.nav.cv}
    />
  );
}
