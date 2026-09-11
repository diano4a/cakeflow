"use client";

import { useTranslations } from "next-intl";

import { SectionDivider } from "@/components/ui/section-divider";

import { CATALOG_KINDS, type CatalogOption } from "../types";
import { CatalogOptionSelect } from "./catalog-option-select";

export function CatalogOrderFields({
  options,
}: {
  options: CatalogOption[];
}) {
  const t = useTranslations("Catalog");

  return (
    <section className="flex flex-col gap-layout">
      <div className="flex flex-col gap-cluster">
        <SectionDivider label={t("orderFieldsLabel")} />
        <p className="type-body text-muted measure">{t("orderFieldsHelp")}</p>
      </div>
      <div className="grid gap-layout sm:grid-cols-2">
        {CATALOG_KINDS.map((kind) => (
          <CatalogOptionSelect
            key={kind}
            kind={kind}
            name={kind}
            required={kind === "product_type"}
            options={options.filter((option) => option.kind === kind)}
          />
        ))}
      </div>
    </section>
  );
}
