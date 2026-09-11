import "server-only";

import { createClient } from "@/lib/supabase/server";

import { isCatalogKind, type CatalogOption } from "./types";

type CatalogOptionRow = {
  id: string;
  bakery_id: string;
  kind: string;
  name: string;
  is_active: boolean;
};

function toOption(row: CatalogOptionRow): CatalogOption | null {
  if (!isCatalogKind(row.kind)) {
    return null;
  }

  return {
    id: row.id,
    bakeryId: row.bakery_id,
    kind: row.kind,
    name: row.name,
    isActive: row.is_active,
  };
}

async function fetchCatalogOptions(
  bakeryId: string,
  activeOnly: boolean,
): Promise<CatalogOption[]> {
  const supabase = await createClient();
  let query = supabase
    .from("catalog_options")
    .select("id, bakery_id, kind, name, is_active")
    .eq("bakery_id", bakeryId)
    .order("created_at", { ascending: true });

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
