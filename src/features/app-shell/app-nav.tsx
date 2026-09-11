"use client";

import { useTranslations } from "next-intl";

import { cn } from "cn";

import { Link, usePathname } from "@/i18n/navigation";

import { APP_NAV_ITEMS } from "./nav";

type AppNavProps = {
  variant?: "tabs" | "panel";
  onNavigate?: () => void;
};

export function AppNav({ variant = "tabs", onNavigate }: AppNavProps) {
  const pathname = usePathname();
  const t = useTranslations("Shell.nav");

  return (
    <ul
      className={
        variant === "tabs" ? "flex flex-row gap-nav" : "flex flex-col divide-y divide-hairline"
      }
    >
      {APP_NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              onClick={onNavigate}
              className={
                variant === "tabs"
                  ? cn(
                      "type-body relative flex h-auto items-center py-cluster",
                      isActive
                        ? "text-ink font-medium after:bg-ink after:absolute after:inset-x-0 after:-bottom-px after:h-rule"
                        : "text-muted hover:text-ink",
                    )
                  : cn(
                      "type-body flex h-control items-center",
                      isActive
                        ? "text-ink font-medium"
                        : "text-muted hover:text-ink",
                    )
              }
            >
              {t(item.key)}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
