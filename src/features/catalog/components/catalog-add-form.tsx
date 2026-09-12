"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addCatalogOption } from "../actions";
import {
  initialCatalogFormState,
  type CatalogFormState,
  type CatalogKind,
  type CatalogOption,
} from "../types";
import { CatalogMeasurementField } from "./catalog-measurement-field";
import { CatalogProductTypeAvailability } from "./catalog-product-type-availability";

export function CatalogAddForm({
  kind,
  productTypes,
  onCancel,
  onSuccess,
}: {
  kind: CatalogKind;
  productTypes: CatalogOption[];
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations("Catalog");
  const [state, setState] = useState<CatalogFormState>(initialCatalogFormState);
  const [pending, setPending] = useState(false);

  const nameError = state.fieldErrors?.name
    ? t(`errors.${state.fieldErrors.name}`)
    : undefined;
  const modeError = state.fieldErrors?.measurementMode
    ? t(`errors.${state.fieldErrors.measurementMode}`)
    : undefined;
  const productTypesError = state.fieldErrors?.productTypes
    ? t(`errors.${state.fieldErrors.productTypes}`)
    : undefined;

  async function submit(formData: FormData) {
    setPending(true);
    const result = await addCatalogOption(initialCatalogFormState, formData);
    setPending(false);

    if (result.status === "ok") {
      onSuccess();
      return;
    }

    setState(result);
  }

  return (
    <form action={submit} className="grid gap-cluster" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="kind" value={kind} />

      {state.formError ? (
        <p role="alert" className="type-label text-ink">
          {t(`errors.${state.formError}`)}
        </p>
      ) : null}

      <div className="flex flex-col gap-cluster sm:flex-row sm:items-end">
        <div className="grid min-w-0 flex-1 gap-1">
          <Label htmlFor={`catalog-add-${kind}`}>{t("addLabel")}</Label>
          <Input
            id={`catalog-add-${kind}`}
            name="name"
            placeholder={t("addPlaceholder")}
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? `catalog-add-${kind}-error` : undefined}
            autoFocus
          />
          {nameError ? (
            <p id={`catalog-add-${kind}-error`} className="type-label text-ink">
              {nameError}
            </p>
          ) : null}
        </div>
        {kind === "product_type" ? (
          <CatalogMeasurementField
            id={`catalog-add-${kind}-mode`}
            error={modeError}
          />
        ) : null}
        <div className="flex shrink-0 items-center gap-cluster">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? t("addPending") : t("addSubmit")}
          </Button>
          <button
            type="button"
            className="type-body text-muted hover:text-ink"
            onClick={onCancel}
          >
            {t("addCancel")}
          </button>
        </div>
      </div>
      {kind === "filling" ? (
        <CatalogProductTypeAvailability
          productTypes={productTypes}
          error={productTypesError}
        />
      ) : null}
    </form>
  );
}
