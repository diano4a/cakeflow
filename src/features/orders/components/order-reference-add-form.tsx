"use client";

import { useActionState, useId } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

import { addOrderReferences } from "../actions";
import { MAX_ORDER_REFERENCES } from "../references";
import { initialOrderReferenceFormState } from "../types";

export function OrderReferenceAddForm({
  orderId,
  attachedCount,
}: {
  orderId: string;
  attachedCount: number;
}) {
  const locale = useLocale();
  const t = useTranslations("Orders");
  const inputId = useId();
  const [state, formAction, isPending] = useActionState(
    addOrderReferences,
    initialOrderReferenceFormState,
  );
  const remaining = MAX_ORDER_REFERENCES - attachedCount;

  if (remaining <= 0) {
    return <p className="type-label">{t("referencesLimitReached")}</p>;
  }

  return (
    <form action={formAction} className="grid gap-cluster">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="orderId" value={orderId} />
      {state.formError ? (
        <p role="alert" className="type-body text-ink border-l-2 border-ink pl-3">
          {t(`errors.${state.formError}`)}
        </p>
      ) : isPending ? (
        <p role="status" className="type-body text-ink">
          {t("referencesUploading")}
        </p>
      ) : null}
      <label
        htmlFor={inputId}
        className="type-body hover:text-ink inline-flex min-h-control cursor-pointer items-center"
      >
        {t("addReferences")}
      </label>
      <input
        id={inputId}
        type="file"
        name="reference"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        disabled={isPending}
        className="sr-only"
      />
      <Button type="submit" variant="outline" disabled={isPending}>
        {isPending ? t("referencesUploading") : t("referencesUpload")}
      </Button>
    </form>
  );
}
