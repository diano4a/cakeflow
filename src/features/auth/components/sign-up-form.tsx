"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { signUp } from "../actions";
import { MIN_PASSWORD_LENGTH, initialAuthFormState } from "../types";
import { AuthField } from "./auth-field";
import { AuthFormError } from "./auth-form-error";

export function SignUpForm() {
  const locale = useLocale();
  const t = useTranslations("Auth");
  const [state, formAction, isPending] = useActionState(
    signUp,
    initialAuthFormState,
  );

  if (state.status === "confirmation-required") {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        {t("checkYourEmail")}
      </p>
    );
  }

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      {state.formError ? (
        <AuthFormError message={t(`errors.${state.formError}`)} />
      ) : null}

      <input type="hidden" name="locale" value={locale} />

      <AuthField
        id="fullName"
        autoComplete="name"
        label={t("fullNameLabel")}
        placeholder={t("fullNamePlaceholder")}
      />

      <AuthField
        id="email"
        type="email"
        autoComplete="email"
        label={t("emailLabel")}
        placeholder={t("emailPlaceholder")}
        error={
          state.fieldErrors?.email
            ? t(`errors.${state.fieldErrors.email}`)
            : undefined
        }
      />

      <AuthField
        id="password"
        type="password"
        autoComplete="new-password"
        label={t("passwordLabel")}
        error={
          state.fieldErrors?.password
            ? t(`errors.${state.fieldErrors.password}`, {
                min: MIN_PASSWORD_LENGTH,
              })
            : undefined
        }
      />

      <Button type="submit" size="lg" disabled={isPending}>
        {isPending ? t("signUpPending") : t("signUpSubmit")}
      </Button>
    </form>
  );
}
