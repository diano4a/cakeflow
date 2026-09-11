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
    <nav aria-label={t("label")} className="flex shrink-0 items-baseline whitespace-nowrap">
      {routing.locales.map((code, index) => {
        const isCurrent = code === locale;

        return (
          <span key={code} className="flex items-baseline">
            {index > 0 ? (
              <span className="type-data text-muted" aria-hidden>
                {" · "}
              </span>
            ) : null}
            <LocaleOption
              code={code}
              href={pathname}
              isCurrent={isCurrent}
              label={t(code === "uk" ? "ukShort" : "enShort")}
              query={query}
            />
          </span>
        );
      })}
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
  const className = cn(
    "type-data",
    isCurrent ? "text-ink font-medium" : "text-muted hover:text-ink",
  );

  if (isCurrent) {
    return (
      <span className={className} lang={code} aria-current="true">
        {label}
      </span>
    );
  }

  return (
    <Link
      href={{ pathname: href, query }}
      locale={code}
      lang={code}
      className={className}
    >
      {label}
    </Link>
  );
}

export function LocaleSwitcher() {
  const t = useTranslations("Locale");

  return (
    <Suspense
      fallback={
        <nav aria-label={t("label")} className="type-data text-muted">
          {t("ukShort")}
        </nav>
      }
    >
      <LocaleSwitcherLinks />
    </Suspense>
  );
}
