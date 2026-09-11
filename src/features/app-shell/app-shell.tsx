import type { ReactNode } from "react";

import { SignOutButton } from "@/features/auth/components/sign-out-button";

import { AppNav } from "./app-nav";

export function AppShell({
  bakeryName,
  bakeryLabel,
  navLabel,
  children,
}: {
  bakeryName: string;
  bakeryLabel: string;
  navLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="px-layout">
        <div className="frame flex flex-col gap-layout pt-layout pb-cluster sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-cluster">
            <p className="type-label">{bakeryLabel}</p>
            <p className="type-heading">{bakeryName}</p>
          </div>
          <SignOutButton />
        </div>
        <nav className="frame hairline-b" aria-label={navLabel}>
          <AppNav />
        </nav>
      </header>

      <main className="flex flex-1 flex-col px-layout py-layout">
        <div className="frame">{children}</div>
      </main>
    </div>
  );
}
