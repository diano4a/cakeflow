"use client";

import { useLocale, useTranslations } from "next-intl";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { signOut } from "../actions";

type SignOutButtonProps = {
  placement?: "chrome" | "panel";
};

function ChromeSubmit() {
  const { pending } = useFormStatus();
  const t = useTranslations("Auth");

  return (
    <Button type="submit" variant="outline" disabled={pending}>
      {pending ? t("signOutPending") : t("signOut")}
    </Button>
  );
}

function PanelSubmit() {
  const { pending } = useFormStatus();
  const t = useTranslations("Auth");

  return (
    <button
      type="submit"
      disabled={pending}
      className="type-body flex min-h-control w-full items-center justify-between py-cluster font-medium disabled:opacity-40"
    >
      <span>{pending ? t("signOutPending") : t("signOut")}</span>
      <span aria-hidden="true">→</span>
    </button>
  );
}

export function SignOutButton({ placement = "chrome" }: SignOutButtonProps) {
  const locale = useLocale();

  return (
    <form action={signOut} className={placement === "panel" ? "hairline-t" : undefined}>
      <input type="hidden" name="locale" value={locale} />
      {placement === "panel" ? <PanelSubmit /> : <ChromeSubmit />}
    </form>
  );
}
