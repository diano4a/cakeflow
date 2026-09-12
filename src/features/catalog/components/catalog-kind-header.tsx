"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import type { CatalogKind, CatalogOption } from "../types";
import { CatalogAddForm } from "./catalog-add-form";

export function CatalogKindHeader({
  kind,
  canManage,
  title,
  productTypes,
}: {
  kind: CatalogKind;
  canManage: boolean;
  title: string;
  productTypes: CatalogOption[];
}) {
  const t = useTranslations("Catalog");
  const [adding, setAdding] = useState(false);

  return (
    <div className="flex flex-col gap-layout">
      <div className="flex items-baseline justify-between gap-layout">
        <div className="min-w-0">
          <h1 className="type-heading">{title}</h1>
          {kind === "product_type" ? (
            <p className="type-body text-muted pt-cluster">{t("productTypeHint")}</p>
          ) : null}
          {kind === "size" ? (
            <p className="type-body text-muted pt-cluster">{t("sizeHint")}</p>
          ) : null}
          {kind === "filling" ? (
            <p className="type-body text-muted pt-cluster">{t("fillingHint")}</p>
          ) : null}
        </div>
        {canManage && !adding ? (
          <button
            type="button"
            className="type-body shrink-0 hover:text-ink"
            onClick={() => setAdding(true)}
          >
            {t("addTrigger")}
          </button>
        ) : null}
      </div>
      {canManage && adding ? (
        <CatalogAddForm
          kind={kind}
          productTypes={productTypes}
          onCancel={() => setAdding(false)}
          onSuccess={() => setAdding(false)}
        />
      ) : null}
    </div>
  );
}
