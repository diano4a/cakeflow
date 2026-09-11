import { getTranslations } from "next-intl/server";

import { SectionDivider } from "@/components/ui/section-divider";

import { CATALOG_KINDS, type CatalogKind, type CatalogOption } from "../types";
import { CatalogAddForm } from "./catalog-add-form";
import { CatalogOptionRow } from "./catalog-option-row";
import { CatalogOrderFields } from "./catalog-order-fields";

function CatalogKindSection({
  kind,
  options,
  canManage,
  title,
  emptyActive,
  inactiveLabel,
}: {
  kind: CatalogKind;
  options: CatalogOption[];
  canManage: boolean;
  title: string;
  emptyActive: string;
  inactiveLabel: string;
}) {
  const active = options.filter((option) => option.isActive);
  const inactive = options.filter((option) => !option.isActive);

  return (
    <section className="flex flex-col gap-cluster">
      <SectionDivider label={title} />
      {active.length === 0 ? (
        <p className="type-body text-muted">{emptyActive}</p>
      ) : (
        <ul className="divide-y divide-hairline hairline-t">
          {active.map((option) => (
            <CatalogOptionRow
              key={`${option.id}-${option.name}`}
              option={option}
              canManage={canManage}
            />
          ))}
        </ul>
      )}
      {canManage ? <CatalogAddForm kind={kind} /> : null}
      {inactive.length > 0 ? (
        <div className="flex flex-col gap-cluster">
          <p className="type-label">{inactiveLabel}</p>
          <ul className="divide-y divide-hairline hairline-t">
            {inactive.map((option) => (
              <CatalogOptionRow
                key={option.id}
                option={option}
                canManage={false}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

export async function CatalogManager({
  options,
  orderOptions,
  canManage,
}: {
  options: CatalogOption[];
  orderOptions: CatalogOption[];
  canManage: boolean;
}) {
  const t = await getTranslations("Catalog");

  return (
    <div className="flex flex-col gap-layout">
      <CatalogOrderFields options={orderOptions} />
      {CATALOG_KINDS.map((kind) => (
        <CatalogKindSection
          key={kind}
          kind={kind}
          options={options.filter((option) => option.kind === kind)}
          canManage={canManage}
          title={t(`kinds.${kind}`)}
          emptyActive={t("emptyActive")}
          inactiveLabel={t("inactive")}
        />
      ))}
    </div>
  );
}
