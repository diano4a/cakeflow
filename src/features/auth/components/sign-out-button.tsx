"use client";

import { useLocale, useTranslations } from "next-intl";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { signOut } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations("Auth");

  return (
    <Button type="submit" variant="quiet" size="sm" disabled={pending}>
      {pending ? t("signOutPending") : t("signOut")}
    </Button>
  );
}

export function SignOutButton() {
  const locale = useLocale();

  return (
    <form action={signOut}>
      <input type="hidden" name="locale" value={locale} />
      <SubmitButton />
    </form>
  );
}
