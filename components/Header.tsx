import { loadContent } from "@/lib/content/loadContent";
import { Menu } from "@/components/Menu";
import type { Language } from "@/lib/i18n/lang";

interface HeaderProps {
  lang: Language;
}

export function Header({ lang }: HeaderProps) {
  const content = loadContent();

  return (
    <Menu
      lang={lang}
      personName={content.person.name}
      personRole={content.person.role}
      navLabels={content.ui.nav}
    />
  );
}
