import localFont from "next/font/local";

/**
 * UAF Sans — the single typeface used across the entire site.
 * Self-hosted from /public/fonts via next/font/local for zero-CLS,
 * automatic preloading and subsetting.
 *
 * Exposes a single CSS variable `--font-uaf` which is aliased in
 * globals.css to `--font-sans` and `--font-display` so all existing
 * Tailwind / CSS usage continues to work.
 */
export const uafSans = localFont({
  src: [
    {
      path: "../../public/fonts/97993b4014ef3480-s.p.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/a48fb31d281438c2-s.p.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/e3496c4820e81925-s.p.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/80bea60395fb22eb-s.p.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-uaf",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "sans-serif"],
});
