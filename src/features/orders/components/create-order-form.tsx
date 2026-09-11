"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CatalogOptionSelect } from "@/features/catalog/components/catalog-option-select";
import { catalogSettingsPath, type CatalogOption } from "@/features/catalog/types";
import { Link } from "@/i18n/navigation";

import { createOrder } from "../actions";
import { initialCreateOrderFormState } from "../types";

export function CreateOrderForm({
  productTypes,
  fillings,
  shapes,
  sizes,
  assignees,
}: {
  productTypes: CatalogOption[];
  fillings: CatalogOption[];
  shapes: CatalogOption[];
  sizes: CatalogOption[];
  assignees: { id: string; label: string }[];
}) {
  const locale = useLocale();
  const t = useTranslations("Orders");
  const [state, formAction, isPending] = useActionState(
    createOrder,
    initialCreateOrderFormState,
  );
  const values = state.values;

  return (
    <form action={formAction} className="grid gap-layout" noValidate>
      <input type="hidden" name="locale" value={locale} />

      {state.formError ? (
        <p
          role="alert"
          className="type-body text-ink border-l-2 border-ink pl-3 font-medium"
        >
          {t(`errors.${state.formError}`)}
        </p>
      ) : null}

      <section className="grid gap-layout md:grid-cols-2">
        {productTypes.length > 0 ? (
          <CatalogOptionSelect
            kind="product_type"
            options={productTypes}
            name="productType"
            required
            defaultValue={values?.productType}
            error={
              state.fieldErrors?.productType
                ? t(`errors.${state.fieldErrors.productType}`)
                : undefined
            }
          />
        ) : (
          <p className="type-body text-muted md:col-span-2">
            {t("emptyProductTypes")}{" "}
            <Link href={catalogSettingsPath("product_type")} className="text-ink hover:text-ink">
              {t("openCatalog")}
            </Link>
          </p>
        )}
        {fillings.length > 0 ? (
          <CatalogOptionSelect
            kind="filling"
            options={fillings}
            name="filling"
            defaultValue={values?.filling}
            error={
              state.fieldErrors?.filling
                ? t(`errors.${state.fieldErrors.filling}`)
                : undefined
            }
          />
        ) : null}
        {shapes.length > 0 ? (
          <CatalogOptionSelect
            kind="shape"
            options={shapes}
            name="shape"
            defaultValue={values?.shape}
            error={
              state.fieldErrors?.shape
                ? t(`errors.${state.fieldErrors.shape}`)
                : undefined
            }
          />
        ) : null}
        {sizes.length > 0 ? (
          <CatalogOptionSelect
            kind="size"
            options={sizes}
            name="size"
            defaultValue={values?.size}
            error={
              state.fieldErrors?.size
                ? t(`errors.${state.fieldErrors.size}`)
                : undefined
            }
          />
        ) : null}
        <Field
          id="weight"
          label={t("fields.weight")}
          error={
            state.fieldErrors?.weight
              ? t(`errors.${state.fieldErrors.weight}`)
              : undefined
          }
        >
          <Input
            id="weight"
            name="weight"
            inputMode="decimal"
            placeholder={t("weightPlaceholder")}
            defaultValue={values?.weight}
            aria-invalid={state.fieldErrors?.weight ? true : undefined}
            aria-describedby={
              state.fieldErrors?.weight ? "weight-error" : undefined
            }
          />
        </Field>
      </section>

      <section className="grid gap-layout">
        <Field id="decoration" label={t("fields.decoration")}>
          <Textarea
            id="decoration"
            name="decoration"
            placeholder={t("decorationPlaceholder")}
            defaultValue={values?.decoration}
          />
        </Field>
        <Field id="inscription" label={t("fields.inscription")}>
          <Input
            id="inscription"
            name="inscription"
            defaultValue={values?.inscription}
          />
        </Field>
      </section>

      <section className="grid gap-layout md:grid-cols-2">
        <Field
          id="deadline"
          label={t("fields.deadline")}
          error={
            state.fieldErrors?.deadline
              ? t(`errors.${state.fieldErrors.deadline}`)
              : undefined
          }
        >
          <Input
            id="deadline"
            name="deadline"
            type="datetime-local"
            defaultValue={values?.deadline}
            aria-invalid={state.fieldErrors?.deadline ? true : undefined}
            aria-describedby={
              state.fieldErrors?.deadline ? "deadline-error" : undefined
            }
          />
        </Field>
        <Field
          id="price"
          label={t("fields.price")}
          error={
            state.fieldErrors?.price
              ? t(`errors.${state.fieldErrors.price}`)
              : undefined
          }
        >
          <Input
            id="price"
            name="price"
            inputMode="decimal"
            placeholder={t("pricePlaceholder")}
            defaultValue={values?.price}
            aria-invalid={state.fieldErrors?.price ? true : undefined}
            aria-describedby={
              state.fieldErrors?.price ? "price-error" : undefined
            }
          />
        </Field>
        <Field
          id="prepayment"
          label={t("fields.prepayment")}
          error={
            state.fieldErrors?.prepayment
              ? t(`errors.${state.fieldErrors.prepayment}`)
              : undefined
          }
        >
          <Input
            id="prepayment"
            name="prepayment"
            inputMode="decimal"
            placeholder={t("pricePlaceholder")}
            defaultValue={values?.prepayment}
            aria-invalid={state.fieldErrors?.prepayment ? true : undefined}
            aria-describedby={
              state.fieldErrors?.prepayment ? "prepayment-error" : undefined
            }
          />
        </Field>
        <div className="grid gap-1">
          <Label htmlFor="assignee">{t("fields.assignee")}</Label>
          <select
            key={values?.assignee ?? ""}
            id="assignee"
            name="assignee"
            defaultValue={values?.assignee ?? ""}
            aria-invalid={state.fieldErrors?.assignee ? true : undefined}
            aria-describedby={
              state.fieldErrors?.assignee ? "assignee-error" : undefined
            }
            className="h-control w-full min-w-0 border-0 border-b border-hairline bg-transparent font-sans text-body text-ink transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink focus-visible:border-b-ink disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:divider-b"
          >
            <option value="">{t("assigneeNone")}</option>
            {assignees.map((member) => (
              <option key={member.id} value={member.id}>
                {member.label}
              </option>
            ))}
          </select>
          <p
            id="assignee-error"
            className="type-label pt-1 text-ink"
            role={state.fieldErrors?.assignee ? "alert" : undefined}
            aria-hidden={state.fieldErrors?.assignee ? undefined : true}
          >
            {state.fieldErrors?.assignee
              ? t(`errors.${state.fieldErrors.assignee}`)
              : "\u00a0"}
          </p>
        </div>
      </section>

      <Field id="notes" label={t("fields.notes")}>
        <Textarea
          id="notes"
          name="notes"
          placeholder={t("notesPlaceholder")}
          defaultValue={values?.notes}
        />
      </Field>

      <div className="flex flex-col gap-cluster sm:flex-row sm:items-center">
        <Button
          type="submit"
          name="intent"
          value="draft"
          variant="outline"
          size="lg"
          disabled={isPending || productTypes.length === 0}
        >
          {isPending ? t("saveDraftPending") : t("saveDraft")}
        </Button>
        <Button
          type="submit"
          name="intent"
          value="submit"
          size="lg"
          disabled={isPending || productTypes.length === 0}
        >
          {isPending ? t("submitPending") : t("submitProduction")}
        </Button>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1">
      <Label htmlFor={id}>{label}</Label>
      {children}
      <p
        id={error ? `${id}-error` : undefined}
        className="type-label pt-1 text-ink"
        role={error ? "alert" : undefined}
        aria-hidden={error ? undefined : true}
      >
        {error ?? "\u00a0"}
      </p>
    </div>
  );
}
