"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionDivider } from "@/components/ui/section-divider";
import { Textarea } from "@/components/ui/textarea";
import { CatalogOptionSelect } from "@/features/catalog/components/catalog-option-select";
import { catalogSettingsPath, type CatalogOption } from "@/features/catalog/types";
import { Link } from "@/i18n/navigation";

import { createOrder } from "../actions";
import { initialCreateOrderFormState } from "../types";

const selectClassName =
  "type-value h-control w-full min-w-0 border-0 border-b border-hairline bg-transparent transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink focus-visible:border-b-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:text-muted aria-invalid:divider-b [&:has(option[value='']:checked)]:text-muted";

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
  const [productType, setProductType] = useState(values?.productType ?? "");
  const [fillingIds, setFillingIds] = useState<string[]>(
    values?.fillingIds && values.fillingIds.length > 0 ? values.fillingIds : [""],
  );
  const [removedFillings, setRemovedFillings] = useState<string[]>([]);
  const selectedProduct = productTypes.find((option) => option.name === productType);
  const measurementMode = selectedProduct?.measurementMode;
  const compatibleFillings = fillings.filter(
    (option) =>
      selectedProduct !== undefined &&
      option.productTypeIds.includes(selectedProduct.id),
  );

  function handleProductTypeChange(next: string) {
    const nextProduct = productTypes.find((option) => option.name === next);
    const allowed = new Set(
      fillings
        .filter(
          (option) =>
            nextProduct !== undefined && option.productTypeIds.includes(nextProduct.id),
        )
        .map((option) => option.id),
    );
    const removed = fillingIds
      .filter((id) => id && !allowed.has(id))
      .map((id) => fillings.find((option) => option.id === id)?.name)
      .filter((name): name is string => Boolean(name));
    const kept = fillingIds.filter((id) => !id || allowed.has(id));

    setProductType(next);
    setFillingIds(kept.length > 0 ? kept : [""]);
    setRemovedFillings(removed);
  }

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

      <FormSection label={t("sections.product")} first>
        {productTypes.length > 0 ? (
          <Pair>
            <CatalogOptionSelect
              kind="product_type"
              options={productTypes}
              name="productType"
              required
              value={productType}
              onChange={handleProductTypeChange}
              error={
                state.fieldErrors?.productType
                  ? t(`errors.${state.fieldErrors.productType}`)
                  : undefined
              }
            />
          </Pair>
        ) : (
          <p className="type-body text-muted">
            {t("emptyProductTypes")}{" "}
            <Link href={catalogSettingsPath("product_type")} className="text-ink hover:text-ink">
              {t("openCatalog")}
            </Link>
          </p>
        )}
        {shapes.length > 0 || measurementMode === "size_and_weight" || measurementMode === "quantity" ? (
          <Pair>
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
            {measurementMode === "size_and_weight" && sizes.length > 0 ? (
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
            {measurementMode === "quantity" ? (
              <Field
                id="quantity"
                label={t("fields.quantity")}
                error={
                  state.fieldErrors?.quantity
                    ? t(`errors.${state.fieldErrors.quantity}`)
                    : undefined
                }
              >
                <Input
                  id="quantity"
                  name="quantity"
                  inputMode="numeric"
                  placeholder={t("quantityPlaceholder")}
                  defaultValue={values?.quantity}
                  className="type-data"
                  aria-invalid={state.fieldErrors?.quantity ? true : undefined}
                  aria-describedby={
                    state.fieldErrors?.quantity ? "quantity-error" : undefined
                  }
                />
              </Field>
            ) : null}
          </Pair>
        ) : null}
        {measurementMode === "size_and_weight" ? (
          <Pair>
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
                className="type-data"
                aria-invalid={state.fieldErrors?.weight ? true : undefined}
                aria-describedby={
                  state.fieldErrors?.weight ? "weight-error" : undefined
                }
              />
            </Field>
          </Pair>
        ) : null}
        {removedFillings.length > 0 ? (
          <p
            role="status"
            className="type-body text-ink border-l-2 border-ink pl-3"
          >
            {t("fillingsRemoved", { names: removedFillings.join(", ") })}
          </p>
        ) : null}
        {!selectedProduct && fillings.length > 0 ? (
          <p className="type-body text-muted">{t("selectProductTypeFirst")}</p>
        ) : null}
        {selectedProduct && compatibleFillings.length === 0 && fillings.length > 0 ? (
          <p className="type-body text-muted">{t("emptyCompatibleFillings")}</p>
        ) : null}
        {compatibleFillings.length > 0 ? (
          <div className="grid gap-cluster">
            {fillingIds.map((fillingId, index) => (
              <div key={index} className="grid gap-cluster sm:grid-cols-[1fr_auto] sm:items-start">
                <CatalogOptionSelect
                  kind="filling"
                  options={compatibleFillings}
                  name="fillingId"
                  optionValue="id"
                  id={`order-catalog-filling-${index}`}
                  value={fillingId}
                  onChange={(next) =>
                    setFillingIds((current) =>
                      current.map((id, row) => (row === index ? next : id)),
                    )
                  }
                  error={
                    index === 0 && state.fieldErrors?.filling
                      ? t(`errors.${state.fieldErrors.filling}`)
                      : undefined
                  }
                />
                {fillingIds.length > 1 ? (
                  <button
                    type="button"
                    className="type-body text-muted hover:text-ink sm:mt-6"
                    onClick={() =>
                      setFillingIds((current) => current.filter((_, row) => row !== index))
                    }
                  >
                    {t("removeFilling")}
                  </button>
                ) : null}
              </div>
            ))}
            <button
              type="button"
              className="type-body justify-self-start text-muted hover:text-ink"
              onClick={() => setFillingIds((current) => [...current, ""])}
            >
              {t("addFilling")}
            </button>
          </div>
        ) : null}
      </FormSection>

      <FormSection label={t("sections.decoration")}>
        <Field id="decoration" label={t("fields.decoration")}>
          <Textarea
            id="decoration"
            name="decoration"
            placeholder={t("decorationPlaceholder")}
            defaultValue={values?.decoration}
          />
        </Field>
        <Pair>
          <Field id="inscription" label={t("fields.inscription")}>
            <Input
              id="inscription"
              name="inscription"
              placeholder={t("inscriptionPlaceholder")}
              defaultValue={values?.inscription}
            />
          </Field>
        </Pair>
      </FormSection>

      <FormSection label={t("sections.references")}>
        <p className="type-body text-muted">{t("referencesPlaceholder")}</p>
      </FormSection>

      <FormSection label={t("sections.deadline")}>
        <DeadlineFields
          defaultValue={values?.deadline}
          error={
            state.fieldErrors?.deadline
              ? t(`errors.${state.fieldErrors.deadline}`)
              : undefined
          }
        />
      </FormSection>

      <FormSection label={t("sections.payment")}>
        <Pair>
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
              className="type-data"
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
              className="type-data"
              aria-invalid={state.fieldErrors?.prepayment ? true : undefined}
              aria-describedby={
                state.fieldErrors?.prepayment ? "prepayment-error" : undefined
              }
            />
          </Field>
        </Pair>
      </FormSection>

      <FormSection label={t("sections.details")}>
        <Pair>
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
              className={selectClassName}
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
        </Pair>
        <Field id="notes" label={t("fields.notes")}>
          <Textarea
            id="notes"
            name="notes"
            placeholder={t("notesPlaceholder")}
            defaultValue={values?.notes}
          />
        </Field>
      </FormSection>

      <div className="divider-t flex flex-col gap-cluster pt-layout sm:flex-row sm:items-center">
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

function FormSection({
  label,
  first = false,
  children,
}: {
  label: string;
  first?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-layout">
      <SectionDivider label={label} className={first ? "pt-0" : undefined} />
      {children}
    </section>
  );
}

function Pair({ children }: { children: ReactNode }) {
  return <div className="grid gap-layout md:grid-cols-2">{children}</div>;
}

function splitDeadline(value?: string) {
  if (!value || !value.includes("T")) {
    return { date: "", time: "" };
  }

  const [date, time] = value.split("T");
  return { date: date ?? "", time: time?.slice(0, 5) ?? "" };
}

function DeadlineFields({
  defaultValue,
  error,
}: {
  defaultValue?: string;
  error?: string;
}) {
  const t = useTranslations("Orders");
  const parts = splitDeadline(defaultValue);

  return (
    <div className="grid gap-1">
      <Pair>
        <div className="grid gap-1">
          <Label htmlFor="deadline-date">{t("fields.deadlineDate")}</Label>
          <Input
            id="deadline-date"
            name="deadlineDate"
            type="date"
            defaultValue={parts.date}
            className="type-data"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "deadline-error" : undefined}
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="deadline-time">{t("fields.deadlineTime")}</Label>
          <Input
            id="deadline-time"
            name="deadlineTime"
            type="time"
            defaultValue={parts.time}
            className="type-data"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "deadline-error" : undefined}
          />
        </div>
      </Pair>
      <p
        id="deadline-error"
        className="type-label pt-1 text-ink"
        role={error ? "alert" : undefined}
        aria-hidden={error ? undefined : true}
      >
        {error ?? "\u00a0"}
      </p>
    </div>
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
