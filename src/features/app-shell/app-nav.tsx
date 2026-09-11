"use client";

import { useTranslations } from "next-intl";

import { cn } from "cn";

import { Link, usePathname } from "@/i18n/navigation";

import { APP_NAV_ITEMS } from "./nav";

export function AppNav() {
  const pathname = usePathname();
  const t = useTranslations("Shell.nav");

  return (
    <ul className="flex flex-col divide-y divide-hairline sm:flex-row sm:gap-6 sm:divide-y-0">
      {APP_NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "type-body flex h-control items-center sm:h-auto sm:py-3",
                isActive ? "text-ink font-medium" : "text-muted hover:text-ink",
              )}
            >
              {t(item.key)}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
