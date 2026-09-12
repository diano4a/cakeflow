"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Checkbox } from "@/components/ui/checkbox";

import type { CatalogOption } from "../types";

export function CatalogProductTypeAvailability({
  productTypes,
  defaultSelectedIds,
  error,
}: {
  productTypes: CatalogOption[];
  defaultSelectedIds?: string[];
  error?: string;
}) {
  const t = useTranslations("Catalog");
  const activeIds = productTypes.map((option) => option.id);
  const [selected, setSelected] = useState<string[]>(() => {
    if (defaultSelectedIds && defaultSelectedIds.length > 0) {
      return defaultSelectedIds.filter((id) => activeIds.includes(id));
    }
    return activeIds;
  });
  const allSelected = activeIds.length > 0 && activeIds.every((id) => selected.includes(id));

  function toggleAll(checked: boolean) {
    setSelected(checked ? activeIds : []);
  }

  function toggleOne(id: string, checked: boolean) {
    setSelected((current) =>
      checked ? [...current, id] : current.filter((value) => value !== id),
    );
  }

  if (productTypes.length === 0) {
    return (
      <p className="type-body text-muted">{t("noProductTypesForFilling")}</p>
    );
  }

  return (
    <fieldset className="grid gap-cluster">
      <legend className="type-label">{t("availableFor")}</legend>
      <label className="flex items-center gap-cluster">
        <Checkbox
          checked={allSelected}
          onCheckedChange={(value) => toggleAll(value === true)}
        />
        {allSelected ? <input type="hidden" name="allProductTypes" value="on" /> : null}
        <span className="type-body">{t("allProductTypes")}</span>
      </label>
      <ul className="grid gap-cluster hairline-t pt-cluster">
        {productTypes.map((option) => {
          const checked = selected.includes(option.id);
          return (
            <li key={option.id}>
              <label className="flex items-center gap-cluster">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(value) => toggleOne(option.id, value === true)}
                />
                {checked ? (
                  <input type="hidden" name="productTypeId" value={option.id} />
                ) : null}
                <span className="type-value">{option.name}</span>
              </label>
            </li>
          );
        })}
      </ul>
      {error ? (
        <p className="type-label text-ink" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
