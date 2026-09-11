import { getLocale, getTranslations } from "next-intl/server";

import { AppShell } from "@/features/app-shell/app-shell";
import { requireWorkspace } from "@/features/bakery/dal";
import { requireUser } from "@/lib/auth/dal";

export default async function AppLayout({
  children,
}: LayoutProps<"/[locale]">) {
  const locale = await getLocale();
  await requireUser(locale);
  const workspace = await requireWorkspace(locale);
  const t = await getTranslations("Shell");

  return (
    <AppShell
      bakeryName={workspace.bakery.name}
      bakeryLabel={t("bakeryLabel")}
      navLabel={t("navLabel")}
    >
      {children}
    </AppShell>
  );
}
