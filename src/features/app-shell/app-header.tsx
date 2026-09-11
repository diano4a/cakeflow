"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { cn } from "cn";

import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { LocaleSwitcher } from "@/i18n/locale-switcher";

import { AppNav } from "./app-nav";

export function AppHeader({
  bakeryName,
  bakeryLabel,
  navLabel,
}: {
  bakeryName: string;
  bakeryLabel: string;
  navLabel: string;
}) {
  const t = useTranslations("Shell");
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    panelRef.current?.focus();

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className="px-layout">
      <div className="frame flex items-center justify-between gap-layout py-cluster md:items-end md:pt-layout md:pb-cluster">
        <div className="min-w-0">
          <p className="type-label hidden md:block">{bakeryLabel}</p>
          <p className="type-heading truncate md:mt-cluster">{bakeryName}</p>
        </div>
        <div className="flex shrink-0 items-center gap-layout">
          <LocaleSwitcher />
          <button
            ref={triggerRef}
            type="button"
            className={cn(
              "type-label flex h-control shrink-0 items-center whitespace-nowrap transition-colors md:hidden",
              open ? "text-ink" : "hover:text-ink",
            )}
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={t("menu")}
            onClick={() => setOpen((current) => !current)}
          >
            {t("menu")}
          </button>
          <div className="hidden md:block">
            <SignOutButton />
          </div>
        </div>
      </div>

      <nav className="frame hairline-b hidden md:block" aria-label={navLabel}>
        <AppNav />
      </nav>

      <div
        ref={panelRef}
        id={panelId}
        tabIndex={-1}
        aria-hidden={open ? undefined : true}
        className={cn(
          "frame hairline-y bg-page outline-none md:hidden",
          open ? "block" : "hidden",
        )}
      >
        <nav aria-label={navLabel}>
          <AppNav variant="panel" onNavigate={() => setOpen(false)} />
        </nav>
        <SignOutButton placement="panel" />
      </div>
    </header>
  );
}
