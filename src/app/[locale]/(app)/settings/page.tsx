import { getLocale, getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/ui/page-header";
import { SpecList, SpecRow } from "@/components/ui/spec-row";
import { requireWorkspace } from "@/features/bakery/dal";
import { CatalogManager } from "@/features/catalog/components/catalog-manager";
import {
  listCatalogOptions,
  listCatalogOptionsForOrder,
} from "@/features/catalog/dal";
import { canManageCatalog } from "@/features/catalog/types";
import { requireUser } from "@/lib/auth/dal";

export default async function SettingsPage() {
  const locale = await getLocale();
  await requireUser(locale);
  const workspace = await requireWorkspace(locale);
  const t = await getTranslations("Settings");
  const [options, orderOptions] = await Promise.all([
    listCatalogOptions(workspace.bakery.id),
    listCatalogOptionsForOrder(workspace.bakery.id),
  ]);

  return (
    <section className="flex flex-col gap-layout">
      <PageHeader title={t("title")} description={t("description")} />

      <SpecList>
        <SpecRow label={t("bakeryLabel")}>{workspace.bakery.name}</SpecRow>
      </SpecList>

      <CatalogManager
        options={options}
        orderOptions={orderOptions}
        canManage={canManageCatalog(workspace.role)}
      />
    </section>
  );
}
