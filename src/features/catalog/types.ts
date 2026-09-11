export const CATALOG_KINDS = [
  "product_type",
  "filling",
  "shape",
  "size",
] as const;

export type CatalogKind = (typeof CATALOG_KINDS)[number];

export type CatalogOption = {
  id: string;
  bakeryId: string;
  kind: CatalogKind;
  name: string;
  isActive: boolean;
};

/** Values are message keys under `Catalog.errors`. */
export type CatalogFormState = {
  status: "idle" | "error" | "ok";
  formError?: string;
  fieldErrors?: {
    name?: string;
  };
};

export const initialCatalogFormState: CatalogFormState = {
  status: "idle",
};

export function isCatalogKind(value: string): value is CatalogKind {
  return (CATALOG_KINDS as readonly string[]).includes(value);
}

export function canManageCatalog(role: string): boolean {
  return role === "owner" || role === "manager";
}
