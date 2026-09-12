"use server";

import { revalidatePath } from "next/cache";
import { hasLocale } from "next-intl";

import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getCurrentWorkspace } from "@/features/bakery/dal";
import { getCurrentUser } from "@/lib/auth/dal";
import { SIGN_IN_PATH } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";

import {
  canManageCatalog,
  isCatalogKind,
  isMeasurementMode,
  type CatalogFormState,
} from "./types";

function readLocale(formData: FormData) {
  const value = String(formData.get("locale") ?? "");
  return hasLocale(routing.locales, value) ? value : routing.defaultLocale;
}

async function requireCatalogManager(locale: string) {
  const user = await getCurrentUser();
  if (!user) {
    return redirect({ href: SIGN_IN_PATH, locale });
  }

  const workspace = await getCurrentWorkspace();
  if (!workspace) {
    return { ok: false as const, error: "unexpected" as const };
  }

  if (!canManageCatalog(workspace.role)) {
    return { ok: false as const, error: "forbidden" as const };
  }

  return { ok: true as const, workspace };
}

function readName(formData: FormData) {
  return String(formData.get("name") ?? "").trim();
}

function mapWriteError(code: string | undefined): CatalogFormState {
  if (code === "23505") {
    return { status: "error", fieldErrors: { name: "nameTaken" } };
  }

  return { status: "error", formError: "unexpected" };
}

function refreshSettings(locale: string) {
  revalidatePath(`/${locale}/settings`, "layout");
}

export async function addCatalogOption(
  _previous: CatalogFormState,
  formData: FormData,
): Promise<CatalogFormState> {
  const locale = readLocale(formData);
  const access = await requireCatalogManager(locale);
  if (!access.ok) {
    return { status: "error", formError: access.error };
  }

  const kind = String(formData.get("kind") ?? "");
  if (!isCatalogKind(kind)) {
    return { status: "error", formError: "unexpected" };
  }

  const name = readName(formData);
  if (!name) {
    return { status: "error", fieldErrors: { name: "nameRequired" } };
  }

  const measurementRaw = String(formData.get("measurementMode") ?? "").trim();
  if (kind === "product_type" && !isMeasurementMode(measurementRaw)) {
    return { status: "error", fieldErrors: { measurementMode: "modeRequired" } };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("catalog_options").insert({
    bakery_id: access.workspace.bakery.id,
    kind,
    name,
    measurement_mode: kind === "product_type" ? measurementRaw : null,
  });

  if (error) {
    console.error("addCatalogOption: insert failed", error);
    return mapWriteError(error.code);
  }

  refreshSettings(locale);
  return { status: "ok" };
}

export async function renameCatalogOption(
  _previous: CatalogFormState,
  formData: FormData,
): Promise<CatalogFormState> {
  const locale = readLocale(formData);
  const access = await requireCatalogManager(locale);
  if (!access.ok) {
    return { status: "error", formError: access.error };
  }

  const id = String(formData.get("id") ?? "");
  const name = readName(formData);
  if (!id) {
    return { status: "error", formError: "unexpected" };
  }
  if (!name) {
    return { status: "error", fieldErrors: { name: "nameRequired" } };
  }

  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("catalog_options")
    .select("kind")
    .eq("id", id)
    .eq("bakery_id", access.workspace.bakery.id)
    .maybeSingle();

  if (existingError || !existing || !isCatalogKind(existing.kind)) {
    return { status: "error", formError: "unexpected" };
  }

  const measurementRaw = String(formData.get("measurementMode") ?? "").trim();
  if (existing.kind === "product_type" && !isMeasurementMode(measurementRaw)) {
    return { status: "error", fieldErrors: { measurementMode: "modeRequired" } };
  }

  const { data, error } = await supabase
    .from("catalog_options")
    .update({
      name,
      measurement_mode:
        existing.kind === "product_type" ? measurementRaw : null,
    })
    .eq("id", id)
    .eq("bakery_id", access.workspace.bakery.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("renameCatalogOption: update failed", error);
    return mapWriteError(error.code);
  }

  if (!data) {
    return { status: "error", formError: "unexpected" };
  }

  refreshSettings(locale);
  return { status: "ok" };
}

export async function deactivateCatalogOption(formData: FormData) {
  const locale = readLocale(formData);
  const access = await requireCatalogManager(locale);
  if (!access.ok) {
    return;
  }

  const id = String(formData.get("id") ?? "");
  if (!id) {
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("catalog_options")
    .update({ is_active: false })
    .eq("id", id)
    .eq("bakery_id", access.workspace.bakery.id);

  if (error) {
    console.error("deactivateCatalogOption: update failed", error);
    return;
  }

  refreshSettings(locale);
}
