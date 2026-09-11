import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Archivo, JetBrains_Mono, Onest } from "next/font/google";

import { routing } from "@/i18n/routing";
import "../globals.css";

/**
 * Onest is the UI/prose face. Ukrainian is CakeFlow's primary language, so
 * this load includes the Cyrillic subsets — UI text must never fall back to
 * a different typeface in `uk` than in `en`.
 */
const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  display: "swap",
});

/**
 * Archivo is display/order-number only. The width axis gives Archivo Expanded
 * (wdth 125%), applied by the `type-display` utility.
 */
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  display: "swap",
});

/** Functional labels, dates, prices and identifiers. Covers Cyrillic. */
const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html
      lang={locale}
      className={`${onest.variable} ${archivo.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <body className="bg-page text-ink flex min-h-full flex-col">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
