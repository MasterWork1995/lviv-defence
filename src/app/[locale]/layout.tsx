import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { LocaleInit } from "@/components/LocaleInit";
import { uafSans } from "../fonts";
import "../globals.css";

export const metadata: Metadata = {
  title: "Купол Львівщини — Закриємо небо разом",
  description:
    "Медійно-фандрейзингова кампанія зі збору коштів на посилення протиповітряного захисту Львівщини. За донат — отримай свою соту на куполі.",
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

  const messages = await getMessages();

  return (
    <html lang={locale} className={uafSans.variable} suppressHydrationWarning>
      <body
        className="min-h-screen bg-bg text-text antialiased"
        suppressHydrationWarning
      >
        <NextIntlClientProvider messages={messages}>
          <LocaleInit />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
