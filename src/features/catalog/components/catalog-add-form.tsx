"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addCatalogOption } from "../actions";
import {
  initialCatalogFormState,
  type CatalogKind,
} from "../types";

export function CatalogAddForm({ kind }: { kind: CatalogKind }) {
  const locale = useLocale();
  const t = useTranslations("Catalog");
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(
    addCatalogOption,
    initialCatalogFormState,
  );

  useEffect(() => {
    if (state.status === "ok") {
      formRef.current?.reset();
    }
  }, [state]);

  const nameError = state.fieldErrors?.name
    ? t(`errors.${state.fieldErrors.name}`)
    : undefined;

  return (
    <form ref={formRef} action={formAction} className="grid gap-cluster" noValidate>
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
          />
          {nameError ? (
            <p id={`catalog-add-${kind}-error`} className="type-label text-ink">
              {nameError}
            </p>
          ) : null}
        </div>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? t("addPending") : t("addSubmit")}
        </Button>
      </div>
    </form>
  );
}
