"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { removeOrderReference } from "../actions";
import type { OrderReference } from "../references";

export function OrderReferenceGallery({
  orderId,
  references,
  canManage,
}: {
  orderId: string;
  references: OrderReference[];
  canManage: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("Orders");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const open = openIndex !== null ? references[openIndex] : null;

  useEffect(() => {
    if (openIndex === null) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenIndex(null);
      }
      if (event.key === "ArrowRight") {
        setOpenIndex((current) =>
          current === null ? current : (current + 1) % references.length,
        );
      }
      if (event.key === "ArrowLeft") {
        setOpenIndex((current) =>
          current === null
            ? current
            : (current - 1 + references.length) % references.length,
        );
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [openIndex, references.length]);

  if (references.length === 0) {
    return <p className="type-body text-muted">{t("referencesEmpty")}</p>;
  }

  return (
    <>
      <ul className="grid grid-cols-3 gap-cluster sm:grid-cols-4">
        {references.map((reference, index) => (
          <li key={reference.id} className="grid gap-cluster">
            <button
              type="button"
              className="border-hairline aspect-square border"
              onClick={() => setOpenIndex(index)}
              aria-label={t("openReference", { index: index + 1 })}
            >
              {/* Signed storage URLs are short-lived and skip next/image. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={reference.url}
                alt=""
                className="size-full object-cover"
              />
            </button>
            {canManage ? (
              <form action={removeOrderReference}>
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="orderId" value={orderId} />
                <input type="hidden" name="referenceId" value={reference.id} />
                <button
                  type="submit"
                  className="type-body text-muted hover:text-ink"
                >
                  {t("removeReference")}
                </button>
              </form>
            ) : null}
          </li>
        ))}
      </ul>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("referenceViewer")}
          className="bg-page fixed inset-0 z-50 flex flex-col"
        >
          <div className="flex items-center justify-between gap-layout px-layout py-cluster">
            <p className="type-label">
              {t("referencePosition", {
                current: (openIndex ?? 0) + 1,
                total: references.length,
              })}
            </p>
            <button
              type="button"
              className="type-body hover:text-ink min-h-control"
              onClick={() => setOpenIndex(null)}
            >
              {t("closeReference")}
            </button>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center px-layout pb-layout">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={open.url}
              alt=""
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
