"use client";

import { useTranslations } from "next-intl";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

import type { CatalogKind, CatalogOption } from "../types";

/**
 * Order-form control for one catalog kind. Only the options passed in are
 * listed; callers should pass `listCatalogOptionsForOrder` so deactivated
 * rows never appear on new orders.
 */
export function CatalogOptionSelect({
  kind,
  options,
  name,
  required = false,
  defaultValue,
}: {
  kind: CatalogKind;
  options: CatalogOption[];
  name: string;
  required?: boolean;
  defaultValue?: string;
}) {
  const t = useTranslations("Catalog");
  const fieldId = `order-catalog-${kind}`;

  return (
    <div className="grid gap-1">
      <Label htmlFor={fieldId}>{t(`fields.${kind}`)}</Label>
      <Select name={name} required={required} defaultValue={defaultValue}>
        <SelectTrigger id={fieldId}>
          <SelectValue placeholder={t("selectPlaceholder")} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.name}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
