"use server";

import { revalidatePath } from "next/cache";
import { hasLocale } from "next-intl";

import { listBakeryMembers, getCurrentWorkspace } from "@/features/bakery/dal";
import { listCatalogOptionsForOrder } from "@/features/catalog/dal";
import { getCurrentUser } from "@/lib/auth/dal";
import { ORDERS_PATH, SIGN_IN_PATH } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

import { parseKyivDateTime } from "./deadline";
import {
  canCreateOrder,
  type CreateOrderFormState,
  type OrderIntent,
} from "./types";

function readLocale(formData: FormData) {
  const value = String(formData.get("locale") ?? "");
  return hasLocale(routing.locales, value) ? value : routing.defaultLocale;
}

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function snapshot(formData: FormData): CreateOrderFormState["values"] {
  return {
    productType: readText(formData, "productType"),
    filling: readText(formData, "filling"),
    shape: readText(formData, "shape"),
    size: readText(formData, "size"),
    weight: readText(formData, "weight"),
    decoration: readText(formData, "decoration"),
    inscription: readText(formData, "inscription"),
    deadline: readText(formData, "deadline"),
    price: readText(formData, "price"),
    prepayment: readText(formData, "prepayment"),
    notes: readText(formData, "notes"),
    assignee: readText(formData, "assignee"),
  };
}

function fail(
  formData: FormData,
  fieldErrors: CreateOrderFormState["fieldErrors"],
  formError?: string,
): CreateOrderFormState {
  return {
    status: "error",
    fieldErrors,
    formError,
    values: snapshot(formData),
  };
}

/** Accepts a dot or comma decimal. Empty is allowed. */
function parseAmount(
  raw: string,
  maxFraction: number,
): { kind: "empty" } | { kind: "invalid" } | { kind: "value"; value: number } {
  const value = raw.trim().replace(",", ".");
  if (!value) {
    return { kind: "empty" };
  }

  if (!new RegExp(`^\\d{1,8}(\\.\\d{1,${maxFraction}})?$`).test(value)) {
    return { kind: "invalid" };
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return { kind: "invalid" };
  }

  return { kind: "value", value: parsed };
}

function namesForKind(
  options: { kind: string; name: string }[],
  kind: string,
) {
  return new Set(
    options.filter((option) => option.kind === kind).map((option) => option.name),
  );
}

export async function createOrder(
  _previous: CreateOrderFormState,
  formData: FormData,
): Promise<CreateOrderFormState> {
  const locale = readLocale(formData);
  const user = await getCurrentUser();
  if (!user) {
    return redirect({ href: SIGN_IN_PATH, locale });
  }

  const workspace = await getCurrentWorkspace();
  if (!workspace) {
    return fail(formData, {}, "unexpected");
  }
  if (!canCreateOrder(workspace.role)) {
    return fail(formData, {}, "forbidden");
  }

  const intentRaw = readText(formData, "intent");
  const intent: OrderIntent = intentRaw === "submit" ? "submit" : "draft";

  const productType = readText(formData, "productType");
  const filling = readText(formData, "filling");
  const shape = readText(formData, "shape");
  const size = readText(formData, "size");
  const deadlineRaw = readText(formData, "deadline");
  const assigneeId = readText(formData, "assignee");
  const decoration = readText(formData, "decoration");
  const inscription = readText(formData, "inscription");
  const notes = readText(formData, "notes");

  const fieldErrors: CreateOrderFormState["fieldErrors"] = {};

  const catalog = await listCatalogOptionsForOrder(workspace.bakery.id);
  const productNames = namesForKind(catalog, "product_type");
  const fillingNames = namesForKind(catalog, "filling");
  const shapeNames = namesForKind(catalog, "shape");
  const sizeNames = namesForKind(catalog, "size");

  if (!productType) {
    fieldErrors.productType = "productRequired";
  } else if (!productNames.has(productType)) {
    fieldErrors.productType = "optionUnavailable";
  }

  if (filling && !fillingNames.has(filling)) {
    fieldErrors.filling = "optionUnavailable";
  }
  if (shape && !shapeNames.has(shape)) {
    fieldErrors.shape = "optionUnavailable";
  }
  if (size && !sizeNames.has(size)) {
    fieldErrors.size = "optionUnavailable";
  }

  const deadline = parseKyivDateTime(deadlineRaw);
  if (!deadlineRaw) {
    fieldErrors.deadline = "deadlineRequired";
  } else if (!deadline) {
    fieldErrors.deadline = "deadlineInvalid";
  }

  const weightParsed = parseAmount(readText(formData, "weight"), 3);
  if (weightParsed.kind === "invalid" || (weightParsed.kind === "value" && weightParsed.value <= 0)) {
    fieldErrors.weight = "weightInvalid";
  }

  const priceParsed = parseAmount(readText(formData, "price"), 2);
  if (priceParsed.kind === "invalid" || (priceParsed.kind === "value" && priceParsed.value < 0)) {
    fieldErrors.price = "priceInvalid";
  }

  const prepaymentParsed = parseAmount(readText(formData, "prepayment"), 2);
  if (
    prepaymentParsed.kind === "invalid" ||
    (prepaymentParsed.kind === "value" && prepaymentParsed.value < 0)
  ) {
    fieldErrors.prepayment = "prepaymentInvalid";
  }

  const price = priceParsed.kind === "value" ? priceParsed.value : null;
  const prepayment = prepaymentParsed.kind === "value" ? prepaymentParsed.value : 0;
  if (price !== null && prepayment > price) {
    fieldErrors.prepayment = "prepaymentExceedsPrice";
  }

  if (assigneeId) {
    const members = await listBakeryMembers(workspace.bakery.id);
    if (!members.some((member) => member.userId === assigneeId)) {
      fieldErrors.assignee = "assigneeInvalid";
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return fail(formData, fieldErrors);
  }

  if (!deadline) {
    return fail(formData, { deadline: "deadlineInvalid" });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("orders").insert({
    bakery_id: workspace.bakery.id,
    product_type: productType,
    filling: filling || null,
    shape: shape || null,
    size_note: size || null,
    weight_kg: weightParsed.kind === "value" ? weightParsed.value : null,
    decoration_notes: decoration || null,
    inscription: inscription || null,
    deadline_at: deadline.toISOString(),
    price,
    prepayment,
    manager_notes: notes || null,
    assignee_id: assigneeId || null,
    created_by: user.id,
    status: intent === "submit" ? "submitted" : "draft",
  });

  if (error) {
    console.error("createOrder: insert failed", error);
    if (error.code === "23514") {
      return fail(formData, { prepayment: "prepaymentExceedsPrice" });
    }
    return fail(formData, {}, "unexpected");
  }

  revalidatePath(`/${locale}${ORDERS_PATH}`);
  return redirect({ href: ORDERS_PATH, locale });
}
