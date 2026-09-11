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
      <header className="px-5 sm:px-8">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 py-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="type-label">{bakeryLabel}</p>
            <p className="type-heading mt-1">{bakeryName}</p>
          </div>
          <SignOutButton />
        </div>
        <nav className="mx-auto w-full max-w-3xl divider-b" aria-label={navLabel}>
          <AppNav />
        </nav>
      </header>

      <main className="flex flex-1 flex-col px-5 py-8 sm:px-8">
        <div className="mx-auto w-full max-w-3xl">{children}</div>
      </main>
    </div>
  );
}
