"use client";

import { useTranslations } from "next-intl";

import { cn } from "cn";

import { Link, usePathname } from "@/i18n/navigation";

import { APP_NAV_ITEMS } from "./nav";

export function AppNav() {
  const pathname = usePathname();
  const t = useTranslations("Shell.nav");

  return (
    <ul className="flex flex-col sm:flex-row sm:gap-nav">
      {APP_NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "type-body relative flex h-control items-center border-b-2 sm:h-auto sm:border-b-0 sm:py-cluster",
                isActive
                  ? "border-ink text-ink font-medium sm:after:bg-ink sm:after:absolute sm:after:inset-x-0 sm:after:-bottom-px sm:after:h-rule"
                  : "border-hairline text-muted hover:text-ink",
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
