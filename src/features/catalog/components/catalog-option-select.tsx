"use client";

import { useTranslations } from "next-intl";

import { Label } from "@/components/ui/label";

import type { CatalogKind, CatalogOption } from "../types";

const selectClassName =
  "type-value h-control w-full min-w-0 border-0 border-b border-hairline bg-transparent transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink focus-visible:border-b-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:text-muted aria-invalid:divider-b [&:has(option[value='']:checked)]:text-muted";

/**
 * Native select so the chosen catalog value is included in FormData. Callers
 * should pass `listCatalogOptionsForOrder` so deactivated rows never appear.
 */
export function CatalogOptionSelect({
  kind,
  options,
  name,
  required = false,
  defaultValue,
  value,
  onChange,
  optionValue = "name",
  id,
  label,
  error,
}: {
  kind: CatalogKind;
  options: CatalogOption[];
  name: string;
  required?: boolean;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  optionValue?: "name" | "id";
  id?: string;
  label?: string;
  error?: string;
}) {
  const t = useTranslations("Catalog");
  const fieldId = id ?? `order-catalog-${kind}`;
  const errorId = `${fieldId}-error`;
  const isControlled = value !== undefined;

  return (
    <div className="grid gap-1">
      <Label htmlFor={fieldId}>{label ?? t(`fields.${kind}`)}</Label>
      <select
        id={fieldId}
        name={name}
        required={false}
        {...(isControlled
          ? { value, onChange: (event) => onChange?.(event.currentTarget.value) }
          : { defaultValue: defaultValue ?? "" })}
        aria-invalid={error ? true : undefined}
        aria-required={required || undefined}
        aria-describedby={error ? errorId : undefined}
        className={selectClassName}
      >
        <option value="">{t("selectPlaceholder")}</option>
        {options.map((option) => (
          <option
            key={option.id}
            value={optionValue === "id" ? option.id : option.name}
          >
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
