"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusText } from "@/components/ui/status-text";
import { renameCatalogOption, deactivateCatalogOption } from "../actions";
import { initialCatalogFormState, type CatalogOption } from "../types";

export function CatalogOptionRow({
  option,
  canManage,
}: {
  option: CatalogOption;
  canManage: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("Catalog");
  const [editing, setEditing] = useState(false);
  const [state, formAction, isPending] = useActionState(
    renameCatalogOption,
    initialCatalogFormState,
  );

  if (!option.isActive) {
    return (
      <li className="flex items-baseline justify-between gap-layout py-cluster">
        <p className="type-body text-muted min-w-0 truncate">{option.name}</p>
        <StatusText emphasis="quiet">{t("inactive")}</StatusText>
      </li>
    );
  }

  if (editing && canManage) {
    const nameError = state.fieldErrors?.name
      ? t(`errors.${state.fieldErrors.name}`)
      : undefined;

    return (
      <li className="py-cluster">
        <form action={formAction} className="grid gap-cluster" noValidate>
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="id" value={option.id} />
          {state.formError ? (
            <p role="alert" className="type-label text-ink">
              {t(`errors.${state.formError}`)}
            </p>
          ) : null}
          <div className="flex flex-col gap-cluster sm:flex-row sm:items-end">
            <div className="grid min-w-0 flex-1 gap-1">
              <Label htmlFor={`catalog-rename-${option.id}`}>{t("rename")}</Label>
              <Input
                id={`catalog-rename-${option.id}`}
                name="name"
                defaultValue={option.name}
                aria-invalid={nameError ? true : undefined}
                aria-describedby={
                  nameError ? `catalog-rename-${option.id}-error` : undefined
                }
              />
              {nameError ? (
                <p
                  id={`catalog-rename-${option.id}-error`}
                  className="type-label text-ink"
                >
                  {nameError}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-cluster">
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? t("renamePending") : t("renameSave")}
              </Button>
              <button
                type="button"
                className="type-label hover:text-ink"
                onClick={() => setEditing(false)}
              >
                {t("renameCancel")}
              </button>
            </div>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-cluster py-cluster sm:flex-row sm:items-center sm:justify-between">
      <p className="type-value min-w-0 truncate">{option.name}</p>
      {canManage ? (
        <div className="flex shrink-0 items-center gap-layout">
          <button
            type="button"
            className="type-label hover:text-ink"
            onClick={() => setEditing(true)}
          >
            {t("rename")}
          </button>
          <form action={deactivateCatalogOption}>
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="id" value={option.id} />
            <button type="submit" className="type-label hover:text-ink">
              {t("deactivate")}
            </button>
          </form>
        </div>
      ) : null}
    </li>
  );
}
