import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { requireWorkspace } from "@/features/bakery/dal";
import { CatalogKindHeader } from "@/features/catalog/components/catalog-kind-header";
import { CatalogOptionRow } from "@/features/catalog/components/catalog-option-row";
import { listCatalogOptionsByKind } from "@/features/catalog/dal";
import {
  CATALOG_SLUGS,
  canManageCatalog,
  isCatalogKindSlug,
} from "@/features/catalog/types";
import { SettingsBackLink } from "@/features/settings/settings-back-link";
import { requireUser } from "@/lib/auth/dal";

export default async function CatalogKindSettingsPage({
  params,
}: PageProps<"/[locale]/settings/catalog/[kind]">) {
  const { kind: slug } = await params;
  if (!isCatalogKindSlug(slug)) {
    notFound();
  }

  const kind = CATALOG_SLUGS[slug];
  const locale = await getLocale();
  await requireUser(locale);
  const workspace = await requireWorkspace(locale);
  const t = await getTranslations("Catalog");
  const options = await listCatalogOptionsByKind(workspace.bakery.id, kind);
  const productTypes =
    kind === "filling"
      ? (await listCatalogOptionsByKind(workspace.bakery.id, "product_type")).filter(
          (option) => option.isActive,
        )
      : [];
  const canManage = canManageCatalog(workspace.role);
  const active = options.filter((option) => option.isActive);
  const inactive = options.filter((option) => !option.isActive);

  return (
    <>
      <SettingsBackLink />
      <CatalogKindHeader
        kind={kind}
        canManage={canManage}
        title={t(`kinds.${kind}`)}
        productTypes={productTypes}
      />
      {active.length === 0 ? (
        <p className="type-body text-muted">{t("emptyActive")}</p>
      ) : (
        <ul className="divide-y divide-hairline hairline-t">
          {active.map((option) => (
            <CatalogOptionRow
              key={`${option.id}-${option.name}`}
              option={option}
              productTypes={productTypes}
              canManage={canManage}
            />
          ))}
        </ul>
      )}
      {inactive.length > 0 ? (
        <div className="flex flex-col gap-cluster">
          <p className="type-label">{t("inactive")}</p>
          <ul className="divide-y divide-hairline hairline-t">
            {inactive.map((option) => (
              <CatalogOptionRow
                key={`${option.id}-${option.name}`}
                option={option}
                productTypes={productTypes}
                canManage={canManage}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}
