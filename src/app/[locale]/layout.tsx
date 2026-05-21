import type { Metadata } from "next";
import { Exo_2, Russo_One } from "next/font/google";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { ClientLocaleProvider } from "@/components/ClientLocaleProvider";
import "../globals.css";

const exo2 = Exo_2({
  variable: "--font-exo2",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const russoOne = Russo_One({
  variable: "--font-russo",
  subsets: ["latin", "cyrillic"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Купол Львівщини — Закриємо небо разом",
  description:
    "Медійно-фандрейзингова кампанія зі збору коштів на посилення протиповітряного захисту Львівщини. Задонатуй — отримай свою соту на куполі.",
  openGraph: {
    title: "Купол Львівщини",
    description: "Закриємо небо разом",
    siteName: "kupol.lviv.ua",
    type: "website",
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Load both locales once on the server — client switches between them instantly (no navigation)
  const [ukMessages, enMessages] = await Promise.all([
    import("../../../messages/uk.json").then((m) => m.default),
    import("../../../messages/en.json").then((m) => m.default),
  ]);

  return (
    <html lang={locale} className={`${exo2.variable} ${russoOne.variable}`}>
      <body className="min-h-screen bg-bg text-text antialiased">
        <ClientLocaleProvider
          initialLocale={locale as "uk" | "en"}
          allMessages={{ uk: ukMessages, en: enMessages }}
        >
          {children}
        </ClientLocaleProvider>
      </body>
    </html>
  );
}
