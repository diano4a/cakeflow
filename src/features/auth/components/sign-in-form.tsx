"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { signIn } from "../actions";
import { initialAuthFormState } from "../types";
import { AuthField } from "./auth-field";
import { AuthFormError } from "./auth-form-error";

export function SignInForm({ redirectTo }: { redirectTo?: string }) {
  const locale = useLocale();
  const t = useTranslations("Auth");
  const [state, formAction, isPending] = useActionState(
    signIn,
    initialAuthFormState,
  );

  return (
    <form action={formAction} className="grid gap-6" noValidate>
      {state.formError ? (
        <AuthFormError message={t(`errors.${state.formError}`)} />
      ) : null}

      <input type="hidden" name="locale" value={locale} />

      {redirectTo ? (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      ) : null}

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
        autoComplete="current-password"
        label={t("passwordLabel")}
        error={
          state.fieldErrors?.password
            ? t(`errors.${state.fieldErrors.password}`)
            : undefined
        }
      />

      <Button type="submit" size="lg" disabled={isPending}>
        {isPending ? t("signInPending") : t("signInSubmit")}
      </Button>
    </form>
  );
}
