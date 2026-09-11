import type { ReactNode } from "react";

import { AppHeader } from "./app-header";

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
      <AppHeader
        bakeryName={bakeryName}
        bakeryLabel={bakeryLabel}
        navLabel={navLabel}
      />

      <main className="flex flex-1 flex-col px-layout py-layout">
        <div className="frame">{children}</div>
      </main>
    </div>
  );
}
