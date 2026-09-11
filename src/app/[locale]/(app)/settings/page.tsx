import { getLocale, getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/ui/page-header";
import { SpecList, SpecRow } from "@/components/ui/spec-row";
import { requireWorkspace } from "@/features/bakery/dal";
import { SettingsNav } from "@/features/settings/settings-nav";
import { requireUser } from "@/lib/auth/dal";

export default async function SettingsPage() {
  const locale = await getLocale();
  await requireUser(locale);
  const workspace = await requireWorkspace(locale);
  const t = await getTranslations("Settings");

  return (
    <section className="flex flex-col gap-layout">
      <PageHeader title={t("title")} description={t("description")} />

      <SpecList>
        <SpecRow label={t("bakeryLabel")}>{workspace.bakery.name}</SpecRow>
      </SpecList>

      <div className="md:hidden">
        <SettingsNav variant="index" />
      </div>
    </section>
  );
}
