import Link from "next/link";
import { loadContent } from "@/lib/content/loadContent";

export default function NotFound() {
  const content = loadContent();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md px-8">
        <h1 className="sr-only">{content.notFound.title.en}</h1>
        <p className="text-mid font-instrument-sans mb-8">
          {content.notFound.text.en}
        </p>
        <Link
          href="/en/"
          className="inline-block bg-accent text-white text-[0.85rem] font-medium font-instrument-sans px-6 py-3 rounded-[6px] hover:opacity-90 transition-opacity duration-150"
        >
          {content.ui.notFound.homeLink.en}
        </Link>
      </div>
    </div>
  );
}
