import { ContactForm } from "@/components/ContactForm";
import { loadContent } from "@/lib/content/loadContent";
import type { Language } from "@/lib/i18n/lang";

interface ContactPageProps {
  params: Promise<{ lang: string }>;
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { lang } = await params;
  const content = loadContent();
  const l = lang as Language;

  return (
    <div>
      <h1 className="sr-only">{content.ui.nav.contact[l]}</h1>
      <p className="text-mid mb-6 font-instrument-sans">
        {content.ui.contact.intro[l]}
      </p>
      <ContactForm lang={l} uiContact={content.ui.contact} />
    </div>
  );
}
