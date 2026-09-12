"use client";

import { useTranslations } from "next-intl";

import { Label } from "@/components/ui/label";

import { MEASUREMENT_MODES, type MeasurementMode } from "../types";

export function CatalogMeasurementField({
  id,
  defaultValue,
  error,
}: {
  id: string;
  defaultValue?: MeasurementMode | null;
  error?: string;
}) {
  const t = useTranslations("Catalog");
  const errorId = `${id}-error`;

  return (
    <div className="grid min-w-0 gap-1 sm:w-56">
      <Label htmlFor={id}>{t("measurementMode")}</Label>
      <select
        id={id}
        name="measurementMode"
        defaultValue={defaultValue ?? "size_and_weight"}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="type-value h-control w-full min-w-0 border-0 border-b border-hairline bg-transparent transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink focus-visible:border-b-ink"
      >
        {MEASUREMENT_MODES.map((mode) => (
          <option key={mode} value={mode}>
            {t(`measurementModes.${mode}`)}
          </option>
        ))}
      </select>
      {error ? (
        <p id={errorId} className="type-label text-ink">
          {error}
        </p>
      ) : null}
    </div>
  );
}
