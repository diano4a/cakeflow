"use server";

import { revalidatePath } from "next/cache";
import { hasLocale } from "next-intl";

import { listBakeryMembers, getCurrentWorkspace } from "@/features/bakery/dal";
import {
  listCatalogOptionsForOrder,
  listProductTypeFillings,
} from "@/features/catalog/dal";
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

function readDeadline(formData: FormData) {
  const date = readText(formData, "deadlineDate");
  const time = readText(formData, "deadlineTime");
  return date && time ? `${date}T${time}` : "";
}

function readFillingIds(formData: FormData) {
  return [
    ...new Set(
      formData
        .getAll("fillingId")
        .map((value) => String(value).trim())
        .filter(Boolean),
    ),
  ];
}

function snapshot(formData: FormData): CreateOrderFormState["values"] {
  return {
    productType: readText(formData, "productType"),
    fillingIds: readFillingIds(formData),
    quantity: readText(formData, "quantity"),
    shape: readText(formData, "shape"),
    size: readText(formData, "size"),
    weight: readText(formData, "weight"),
    decoration: readText(formData, "decoration"),
    inscription: readText(formData, "inscription"),
    deadline: readDeadline(formData),
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

function parseQuantity(raw: string) {
  const value = raw.trim();
  if (!value) {
    return { kind: "empty" as const };
  }
  if (!/^[1-9]\d{0,5}$/.test(value)) {
    return { kind: "invalid" as const };
  }
  return { kind: "value" as const, value: Number(value) };
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
  const fillingIds = readFillingIds(formData);
  const shape = readText(formData, "shape");
  const size = readText(formData, "size");
  const deadlineRaw = readDeadline(formData);
  const assigneeId = readText(formData, "assignee");
  const decoration = readText(formData, "decoration");
  const inscription = readText(formData, "inscription");
  const notes = readText(formData, "notes");

  const fieldErrors: CreateOrderFormState["fieldErrors"] = {};

  const catalog = await listCatalogOptionsForOrder(workspace.bakery.id);
  const product = catalog.find(
    (option) => option.kind === "product_type" && option.name === productType,
  );
  const fillingIdsAllowed = new Set(
    catalog.filter((option) => option.kind === "filling").map((option) => option.id),
  );
  const compatibleFillingIds = new Set(
    (await listProductTypeFillings(workspace.bakery.id))
      .filter((link) => link.productTypeId === product?.id)
      .map((link) => link.fillingId),
  );
  const shapeNames = namesForKind(catalog, "shape");
  const sizeNames = namesForKind(catalog, "size");

  if (!productType) {
    fieldErrors.productType = "productRequired";
  } else if (!product?.measurementMode) {
    fieldErrors.productType = "optionUnavailable";
  }

  if (fillingIds.some((id) => !fillingIdsAllowed.has(id))) {
    fieldErrors.filling = "optionUnavailable";
  } else if (fillingIds.some((id) => !compatibleFillingIds.has(id))) {
    fieldErrors.filling = "fillingIncompatible";
  }
  if (shape && !shapeNames.has(shape)) {
    fieldErrors.shape = "optionUnavailable";
  }

  const deadlineDate = readText(formData, "deadlineDate");
  const deadlineTime = readText(formData, "deadlineTime");
  const deadline = parseKyivDateTime(deadlineRaw);
  if (!deadlineDate && !deadlineTime) {
    fieldErrors.deadline = "deadlineRequired";
  } else if (!deadlineRaw || !deadline) {
    fieldErrors.deadline = "deadlineInvalid";
  }

  const mode = product?.measurementMode;
  const weightParsed = parseAmount(readText(formData, "weight"), 3);
  const quantityParsed = parseQuantity(readText(formData, "quantity"));

  if (mode === "size_and_weight") {
    if (size && !sizeNames.has(size)) {
      fieldErrors.size = "optionUnavailable";
    }
    if (weightParsed.kind === "invalid" || (weightParsed.kind === "value" && weightParsed.value <= 0)) {
      fieldErrors.weight = "weightInvalid";
    }
  } else if (mode === "quantity") {
    if (quantityParsed.kind !== "value") {
      fieldErrors.quantity = "quantityInvalid";
    }
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

  if (!product?.measurementMode || !deadline) {
    return fail(formData, { deadline: "deadlineInvalid" });
  }

  const savedMode = product.measurementMode;

  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("orders")
    .insert({
      bakery_id: workspace.bakery.id,
      product_type: productType,
      shape: shape || null,
      size_note: savedMode === "size_and_weight" && size ? size : null,
      weight_kg:
        savedMode === "size_and_weight" && weightParsed.kind === "value"
          ? weightParsed.value
          : null,
      quantity: savedMode === "quantity" && quantityParsed.kind === "value"
        ? quantityParsed.value
        : null,
      decoration_notes: decoration || null,
      inscription: inscription || null,
      deadline_at: deadline.toISOString(),
      price,
      prepayment,
      manager_notes: notes || null,
      assignee_id: assigneeId || null,
      created_by: user.id,
      status: intent === "submit" ? "submitted" : "draft",
    })
    .select("id")
    .single();

  if (error || !created) {
    console.error("createOrder: insert failed", error);
    if (error?.code === "23514") {
      return fail(formData, { prepayment: "prepaymentExceedsPrice" });
    }
    return fail(formData, {}, "unexpected");
  }

  if (fillingIds.length > 0) {
    const { error: fillingError } = await supabase.from("order_fillings").insert(
      fillingIds.map((catalogOptionId) => ({
        bakery_id: workspace.bakery.id,
        order_id: created.id,
        catalog_option_id: catalogOptionId,
      })),
    );

    if (fillingError) {
      console.error("createOrder: fillings insert failed", fillingError);
      await supabase.from("orders").delete().eq("id", created.id);
      return fail(formData, { filling: "optionUnavailable" });
    }
  }

  revalidatePath(`/${locale}${ORDERS_PATH}`);
  return redirect({ href: ORDERS_PATH, locale });
}
