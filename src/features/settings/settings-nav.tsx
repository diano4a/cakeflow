"use client";

import { useTranslations } from "next-intl";

import { cn } from "cn";

import { CATALOG_KINDS, catalogSettingsPath } from "@/features/catalog/types";
import { Link, usePathname } from "@/i18n/navigation";
import { SETTINGS_PATH } from "@/lib/auth/routes";

export function SettingsNav({
  variant,
}: {
  variant: "sidebar" | "index";
}) {
  const pathname = usePathname();
  const t = useTranslations("Settings");
  const catalogT = useTranslations("Catalog");
  const isIndex = variant === "index";

  return (
    <nav aria-label={t("navLabel")} className="flex flex-col gap-layout">
      {isIndex ? null : (
        <ul className="flex flex-col">
          <li>
            <SettingsNavLink
              href={SETTINGS_PATH}
              isActive={pathname === SETTINGS_PATH}
              isIndex={false}
            >
              {t("bakeryNav")}
            </SettingsNavLink>
          </li>
        </ul>
      )}

      <div className="flex flex-col gap-cluster">
        <p className="type-label">{t("catalogNav")}</p>
        <ul className={isIndex ? "divide-y divide-hairline hairline-t" : "flex flex-col"}>
          {CATALOG_KINDS.map((kind) => {
            const href = catalogSettingsPath(kind);
            return (
              <li key={kind}>
                <SettingsNavLink
                  href={href}
                  isActive={pathname === href}
                  isIndex={isIndex}
                >
                  {catalogT(`kinds.${kind}`)}
                </SettingsNavLink>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

function SettingsNavLink({
  href,
  isActive,
  isIndex,
  children,
}: {
  href: string;
  isActive: boolean;
  isIndex: boolean;
  children: string;
}) {
  if (isIndex) {
    return (
      <Link
        href={href}
        aria-current={isActive ? "page" : undefined}
        className="type-body flex h-control items-center justify-between"
      >
        <span className={isActive ? "text-ink font-medium" : "text-ink"}>
          {children}
        </span>
        <span className="text-muted" aria-hidden="true">
          →
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "type-body relative flex items-center py-cluster pl-cluster",
        isActive
          ? "text-ink font-medium before:bg-ink before:absolute before:inset-y-0 before:left-0 before:w-rule"
          : "text-muted hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}
