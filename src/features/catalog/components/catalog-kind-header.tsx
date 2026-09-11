"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import type { CatalogKind } from "../types";
import { CatalogAddForm } from "./catalog-add-form";

export function CatalogKindHeader({
  kind,
  canManage,
  title,
}: {
  kind: CatalogKind;
  canManage: boolean;
  title: string;
}) {
  const t = useTranslations("Catalog");
  const [adding, setAdding] = useState(false);

  return (
    <div className="flex flex-col gap-layout">
      <div className="flex items-baseline justify-between gap-layout">
        <h1 className="type-heading">{title}</h1>
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
          onCancel={() => setAdding(false)}
          onSuccess={() => setAdding(false)}
        />
      ) : null}
    </div>
  );
}
