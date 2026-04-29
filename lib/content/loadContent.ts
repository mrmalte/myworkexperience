import contentData from "@/public/content/site-content.json";

export interface LocalizedText {
  en: string;
  sv: string;
}

export interface CVEntry {
  id: string;
  type: string;
  period: {
    raw: string;
    start: string;
    end: string | null;
  };
  sortKey: string;
  organization: string;
  client: string | null;
  role: string;
  location: string;
  locationType: string;
  title: LocalizedText;
  description: LocalizedText;
  technologies: string[];
}

export interface TechItem {
  name: string;
  years: number;
}

export interface SiteContent {
  schemaVersion: string;
  generatedAt: string;
  person: {
    name: string;
    role: string;
  };
  about: {
    text: LocalizedText;
  };
  notFound: {
    title: LocalizedText;
    text: LocalizedText;
  };
  technologies: Record<string, TechItem[]>;
  cv: {
    summary: LocalizedText;
    education: CVEntry[];
    roles: CVEntry[];
    assignments: CVEntry[];
  };
  ui: {
    nav: {
      cv: LocalizedText;
      technologies: LocalizedText;
      about: LocalizedText;
      contact: LocalizedText;
    };
    cv: {
      sections: {
        education: LocalizedText;
        roles: LocalizedText;
        assignments: LocalizedText;
      };
      searchPlaceholder: LocalizedText;
      clearSearch: LocalizedText;
      showAll: LocalizedText;
      showMoreSummary: LocalizedText;
      noResults: LocalizedText;
      present: LocalizedText;
    };
    contact: {
      intro: LocalizedText;
      fields: {
        name: LocalizedText;
        email: LocalizedText;
        subject: LocalizedText;
        message: LocalizedText;
      };
      submit: LocalizedText;
      success: LocalizedText;
      error: LocalizedText;
      sending: LocalizedText;
      validation: {
        required: LocalizedText;
        email: LocalizedText;
      };
    };
    meta: {
      title: LocalizedText;
      description: LocalizedText;
    };
    notFound: {
      homeLink: LocalizedText;
    };
    technologies: {
      allCategory: LocalizedText;
      sortTime: LocalizedText;
      sortAlpha: LocalizedText;
      yearsLessThanOne: LocalizedText;
      yearsOne: LocalizedText;
      yearsSuffix: LocalizedText;
    };
  };
}

export function loadContent(): SiteContent {
  return contentData as unknown as SiteContent;
}
