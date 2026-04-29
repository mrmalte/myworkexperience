import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: "#1a6b4a",
        "accent-light": "#e8f3ee",
        off: "#f8f7f5",
        line: "#e5e2dc",
        "cv-text": "#1a1816",
        mid: "#7a756d",
        warm: "#c8601a",
      },
      fontFamily: {
        fraunces: ["Fraunces", "serif"],
        "instrument-sans": ["Instrument Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
