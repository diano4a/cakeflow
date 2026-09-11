"use client";

import { useTranslations } from "next-intl";

import { Label } from "@/components/ui/label";

import type { CatalogKind, CatalogOption } from "../types";

const selectClassName =
  "h-control w-full min-w-0 border-0 border-b border-hairline bg-transparent font-sans text-body text-ink transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink focus-visible:border-b-ink disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:divider-b";

/**
 * Native select so the chosen catalog name is included in FormData. Radix
 * Select does not post a value with a server action. Callers should pass
 * `listCatalogOptionsForOrder` so deactivated rows never appear.
 */
export function CatalogOptionSelect({
  kind,
  options,
  name,
  required = false,
  defaultValue,
  error,
}: {
  kind: CatalogKind;
  options: CatalogOption[];
  name: string;
  required?: boolean;
  defaultValue?: string;
  error?: string;
}) {
  const t = useTranslations("Catalog");
  const fieldId = `order-catalog-${kind}`;
  const errorId = `${fieldId}-error`;

  return (
    <div className="grid gap-1">
      <Label htmlFor={fieldId}>{t(`fields.${kind}`)}</Label>
      <select
        key={defaultValue ?? ""}
        id={fieldId}
        name={name}
        defaultValue={defaultValue ?? ""}
        aria-invalid={error ? true : undefined}
        aria-required={required || undefined}
        aria-describedby={error ? errorId : undefined}
        className={selectClassName}
      >
        <option value="">{t("selectPlaceholder")}</option>
        {options.map((option) => (
          <option key={option.id} value={option.name}>
            {option.name}
          </option>
        ))}
      </select>
      <p
        id={error ? errorId : undefined}
        className="type-label pt-1 text-ink"
        role={error ? "alert" : undefined}
        aria-hidden={error ? undefined : true}
      >
        {error ?? "\u00a0"}
      </p>
    </div>
  );
}
