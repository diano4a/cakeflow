import type { ReactNode } from "react";

import { SettingsNav } from "./settings-nav";

export function SettingsLayoutFrame({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-layout md:grid md:grid-cols-4 md:items-start md:gap-layout">
      <aside className="hidden md:col-span-1 md:block md:border-r md:border-hairline md:pr-layout">
        <SettingsNav variant="sidebar" />
      </aside>
      <div className="flex min-w-0 flex-col gap-layout md:col-span-3">
        {children}
      </div>
    </div>
  );
}
