import { getLocale, getTranslations } from "next-intl/server";

import { SpecList, SpecRow } from "@/components/ui/spec-row";
import { requireWorkspace } from "@/features/bakery/dal";
import { requireUser } from "@/lib/auth/dal";

export default async function OverviewPage() {
  const locale = await getLocale();
  const user = await requireUser(locale);
  const workspace = await requireWorkspace(locale);
  const t = await getTranslations("Overview");

  return (
    <section>
      <h1 className="type-heading">{t("title")}</h1>
      <p className="type-body text-muted measure mt-5">{t("placeholder")}</p>

      <SpecList className="mt-8">
        <SpecRow label={t("bakeryLabel")}>{workspace.bakery.name}</SpecRow>
        <SpecRow label={t("roleLabel")}>{t(`roles.${workspace.role}`)}</SpecRow>
        <SpecRow label={t("accountLabel")} data>
          {user.email}
        </SpecRow>
      </SpecList>
    </section>
  );
}
