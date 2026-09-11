"use client";

import { Suspense } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { cn } from "cn";

import { Link, usePathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

function LocaleSwitcherLinks() {
  const t = useTranslations("Locale");
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = Object.fromEntries(searchParams.entries());

  return (
    <nav aria-label={t("label")} className="flex items-baseline gap-layout">
      <span className="type-label">{t("label")}</span>
      <ul className="flex gap-layout">
        {routing.locales.map((code) => {
          const isCurrent = code === locale;

          return (
            <li key={code}>
              <LocaleOption
                code={code}
                href={pathname}
                isCurrent={isCurrent}
                label={t(code)}
                query={query}
              />
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function LocaleOption({
  code,
  href,
  isCurrent,
  label,
  query,
}: {
  code: Locale;
  href: string;
  isCurrent: boolean;
  label: string;
  query: Record<string, string>;
}) {
  if (isCurrent) {
    return (
      <span className="type-body font-medium" aria-current="true">
        {label}
      </span>
    );
  }

  return (
    <Link
      href={{ pathname: href, query }}
      locale={code}
      className={cn("type-body text-muted hover:text-ink")}
    >
      {label}
    </Link>
  );
}

function LocaleSwitcherFallback() {
  const t = useTranslations("Locale");

  return (
    <nav aria-label={t("label")} className="flex items-baseline gap-layout">
      <span className="type-label">{t("label")}</span>
    </nav>
  );
}

export function LocaleSwitcher() {
  return (
    <Suspense fallback={<LocaleSwitcherFallback />}>
      <LocaleSwitcherLinks />
    </Suspense>
  );
}
