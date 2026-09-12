export const CATALOG_KINDS = [
  "product_type",
  "filling",
  "shape",
  "size",
] as const;

export type CatalogKind = (typeof CATALOG_KINDS)[number];

export const MEASUREMENT_MODES = ["size_and_weight", "quantity"] as const;

export type MeasurementMode = (typeof MEASUREMENT_MODES)[number];

export type CatalogOption = {
  id: string;
  bakeryId: string;
  kind: CatalogKind;
  name: string;
  isActive: boolean;
  measurementMode: MeasurementMode | null;
  productTypeIds: string[];
};

export type ProductTypeFilling = {
  productTypeId: string;
  fillingId: string;
};

export function isMeasurementMode(value: string): value is MeasurementMode {
  return (MEASUREMENT_MODES as readonly string[]).includes(value);
}

/** Values are message keys under `Catalog.errors`. */
export type CatalogFormState = {
  status: "idle" | "error" | "ok";
  formError?: string;
  fieldErrors?: {
    name?: string;
    measurementMode?: string;
    productTypes?: string;
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

export const CATALOG_KIND_SLUGS = {
  product_type: "product-types",
  filling: "fillings",
  shape: "shapes",
  size: "sizes",
} as const;

export type CatalogKindSlug = (typeof CATALOG_KIND_SLUGS)[CatalogKind];

export const CATALOG_SLUGS = {
  "product-types": "product_type",
  fillings: "filling",
  shapes: "shape",
  sizes: "size",
} as const;

export function isCatalogKindSlug(value: string): value is CatalogKindSlug {
  return Object.hasOwn(CATALOG_SLUGS, value);
}

export function catalogSettingsPath(kind: CatalogKind) {
  return `/settings/catalog/${CATALOG_KIND_SLUGS[kind]}`;
}
