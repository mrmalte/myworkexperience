import type { Metadata } from "next";
import "@/app/globals.css";
import { loadContent } from "@/lib/content/loadContent";

const content = loadContent();

export const metadata: Metadata = {
  title: content.ui.meta.title.en,
  description: content.ui.meta.description.en,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,600&family=Instrument+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
