import "server-only";

import { createClient } from "@/lib/supabase/server";

import {
  isCatalogKind,
  isMeasurementMode,
  type CatalogKind,
  type CatalogOption,
} from "./types";

type CatalogOptionRow = {
  id: string;
  bakery_id: string;
  kind: string;
  name: string;
  is_active: boolean;
  measurement_mode: string | null;
};

function toOption(row: CatalogOptionRow): CatalogOption | null {
  if (!isCatalogKind(row.kind)) {
    return null;
  }

  const measurementMode =
    row.measurement_mode && isMeasurementMode(row.measurement_mode)
      ? row.measurement_mode
      : null;

  if (row.kind === "product_type" && !measurementMode) {
    return null;
  }

  return {
    id: row.id,
    bakeryId: row.bakery_id,
    kind: row.kind,
    name: row.name,
    isActive: row.is_active,
    measurementMode,
  };
}

async function fetchCatalogOptions(
  bakeryId: string,
  activeOnly: boolean,
  kind?: CatalogKind,
): Promise<CatalogOption[]> {
  const supabase = await createClient();
  let query = supabase
    .from("catalog_options")
    .select("id, bakery_id, kind, name, is_active, measurement_mode")
    .eq("bakery_id", bakeryId)
    .order("created_at", { ascending: true });

  if (kind) {
    query = query.eq("kind", kind);
  }

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    console.error("fetchCatalogOptions: failed to read catalog options", error);
    return [];
  }

  return (data ?? []).flatMap((row) => {
    const option = toOption(row);
    return option ? [option] : [];
  });
}

/** Settings: active and inactive options for the current bakery. */
export function listCatalogOptions(bakeryId: string) {
  return fetchCatalogOptions(bakeryId, false);
}

/**
 * Active options only. The order form (KAN-14) should call this so
 * deactivated labels are not offered on new orders.
 */
export function listCatalogOptionsForOrder(bakeryId: string) {
  return fetchCatalogOptions(bakeryId, true);
}

export function listCatalogOptionsByKind(bakeryId: string, kind: CatalogKind) {
  return fetchCatalogOptions(bakeryId, false, kind);
}
