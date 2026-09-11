"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBakery } from "../actions";
import { initialCreateBakeryFormState } from "../types";

export function CreateBakeryForm() {
  const locale = useLocale();
  const t = useTranslations("Onboarding");
  const [state, formAction, isPending] = useActionState(
    createBakery,
    initialCreateBakeryFormState,
  );

  const nameError = state.fieldErrors?.name
    ? t(`errors.${state.fieldErrors.name}`)
    : undefined;

  return (
    <form action={formAction} className="grid gap-6" noValidate>
      {state.formError ? (
        <p
          role="alert"
          className="type-body text-ink border-l-2 border-ink pl-3 font-medium"
        >
          {t(`errors.${state.formError}`)}
        </p>
      ) : null}

      <input type="hidden" name="locale" value={locale} />

      <div className="grid gap-1">
        <Label htmlFor="name">{t("nameLabel")}</Label>
        <Input
          id="name"
          name="name"
          autoComplete="organization"
          placeholder={t("namePlaceholder")}
          aria-invalid={nameError ? true : undefined}
          aria-describedby={nameError ? "name-error" : undefined}
        />
        {nameError ? (
          <p id="name-error" className="type-label text-ink pt-1">
            {nameError}
          </p>
        ) : null}
      </div>

      <Button type="submit" size="lg" disabled={isPending}>
        {isPending ? t("pending") : t("submit")}
      </Button>
    </form>
  );
}
