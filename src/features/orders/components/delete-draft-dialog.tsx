"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRef } from "react";

import { Button } from "@/components/ui/button";

import { deleteDraft } from "../actions";
import type { DateFilter, StatusFilter } from "../list";

export function DeleteDraftDialog({
  orderId,
  orderLabel,
  status,
  date,
}: {
  orderId: string;
  orderLabel: string;
  status: StatusFilter;
  date: DateFilter;
}) {
  const locale = useLocale();
  const t = useTranslations("Orders");
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        className="type-body inline-flex min-h-control items-center underline decoration-hairline underline-offset-4 hover:decoration-ink focus-visible:bg-tile"
        aria-haspopup="dialog"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          dialogRef.current?.showModal();
        }}
      >
        {t("deleteDraft")}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={`delete-draft-title-${orderId}`}
        className="bg-paper text-ink m-auto w-full max-w-[var(--container-brief)] border border-hairline p-layout backdrop:bg-ink/40"
      >
        <form action={deleteDraft} className="grid gap-layout">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="status" value={status} />
          <input type="hidden" name="date" value={date} />
          <div className="grid gap-cluster">
            <h2
              id={`delete-draft-title-${orderId}`}
              className="type-heading"
            >
              {t("deleteDraftTitle")}
            </h2>
            <p className="type-body">{t("deleteDraftBody", { order: orderLabel })}</p>
          </div>
          <div className="flex flex-wrap gap-cluster">
            <Button type="submit">{t("deleteDraftConfirm")}</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => dialogRef.current?.close()}
            >
              {t("deleteDraftCancel")}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
