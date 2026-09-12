"use client";

import { useEffect, useId, useMemo } from "react";
import { useTranslations } from "next-intl";

import {
  MAX_ORDER_REFERENCES,
  validateReferenceFiles,
} from "../references";

export function OrderReferenceFields({
  files,
  onChange,
  error,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  error?: string;
}) {
  const t = useTranslations("Orders");
  const inputId = useId();
  const clientError = validateReferenceFiles(files);

  return (
    <div className="grid gap-cluster">
      {files.length > 0 ? (
        <ul className="grid grid-cols-3 gap-cluster sm:grid-cols-4">
          {files.map((file, index) => (
            <li key={`${file.name}-${file.lastModified}-${index}`} className="grid gap-cluster">
              <LocalReferenceThumb file={file} />
              <button
                type="button"
                className="type-body text-muted hover:text-ink text-left"
                onClick={() => onChange(files.filter((_, item) => item !== index))}
              >
                {t("removeReference")}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="type-body text-muted">{t("referencesEmpty")}</p>
      )}

      <label
        htmlFor={inputId}
        className="type-body hover:text-ink inline-flex min-h-control cursor-pointer items-center"
      >
        {t("addReferences")}
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="sr-only"
        onChange={(event) => {
          const selected = event.currentTarget.files;
          if (selected) {
            onChange([...files, ...Array.from(selected)].slice(0, MAX_ORDER_REFERENCES));
          }
          event.currentTarget.value = "";
        }}
      />

      {error || clientError ? (
        <p role="alert" className="type-body text-ink border-l-2 border-ink pl-3">
          {t(`errors.${error ?? clientError}`)}
        </p>
      ) : (
        <p className="type-label">{t("referencesHint")}</p>
      )}
    </div>
  );
}

function LocalReferenceThumb({ file }: { file: File }) {
  const url = useMemo(() => URL.createObjectURL(file), [file]);

  useEffect(() => {
    return () => URL.revokeObjectURL(url);
  }, [url]);

  return (
    <div className="border-hairline aspect-square border">
      {/* Object URLs are not eligible for next/image. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="size-full object-cover" />
    </div>
  );
}
