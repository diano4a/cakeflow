import { getLocale, getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/ui/page-header";
import { SpecList, SpecRow } from "@/components/ui/spec-row";
import { requireWorkspace } from "@/features/bakery/dal";
import { requireUser } from "@/lib/auth/dal";

export default async function SettingsPage() {
  const locale = await getLocale();
  await requireUser(locale);
  const workspace = await requireWorkspace(locale);
  const t = await getTranslations("Settings");

  return (
    <section className="flex flex-col gap-layout">
      <PageHeader title={t("title")} description={t("placeholder")} />

      <SpecList>
        <SpecRow label={t("bakeryLabel")}>{workspace.bakery.name}</SpecRow>
      </SpecList>
    </section>
  );
}
