import { getLocale, getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/ui/page-header";
import { SpecList, SpecRow } from "@/components/ui/spec-row";
import { requireWorkspace } from "@/features/bakery/dal";
import { formatDateTime } from "@/i18n/format";
import { requireUser } from "@/lib/auth/dal";

export default async function OverviewPage() {
  const locale = await getLocale();
  const user = await requireUser(locale);
  const workspace = await requireWorkspace(locale);
  const t = await getTranslations("Overview");
  const createdAt = await formatDateTime(workspace.bakery.createdAt);

  return (
    <section className="flex flex-col gap-layout">
      <PageHeader title={t("title")} description={t("placeholder")} />

      <SpecList>
        <SpecRow label={t("bakeryLabel")}>{workspace.bakery.name}</SpecRow>
        <SpecRow label={t("roleLabel")}>{t(`roles.${workspace.role}`)}</SpecRow>
        <SpecRow label={t("createdAtLabel")} data>
          {createdAt}
        </SpecRow>
        <SpecRow label={t("accountLabel")} data>
          {user.email}
        </SpecRow>
      </SpecList>
    </section>
  );
}
