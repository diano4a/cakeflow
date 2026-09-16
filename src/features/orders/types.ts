export type OrderIntent = "draft" | "submit";

/** Values are message keys under `Orders.errors`. */
export type CreateOrderFormState = {
  status: "idle" | "error";
  formError?: string;
  fieldErrors?: {
    productType?: string;
    filling?: string;
    quantity?: string;
    shape?: string;
    size?: string;
    weight?: string;
    deadline?: string;
    price?: string;
    prepayment?: string;
    assignee?: string;
    references?: string;
  };
  values?: {
    productType?: string;
    fillingIds?: string[];
    quantity?: string;
    shape?: string;
    size?: string;
    weight?: string;
    decoration?: string;
    inscription?: string;
    deadline?: string;
    price?: string;
    prepayment?: string;
    notes?: string;
    assignee?: string;
  };
};

export const initialCreateOrderFormState: CreateOrderFormState = {
  status: "idle",
};

export type OrderReferenceFormState = {
  status: "idle" | "error";
  formError?: string;
};

export const initialOrderReferenceFormState: OrderReferenceFormState = {
  status: "idle",
};

export const ORDER_STATUSES = [
  "draft",
  "submitted",
  "accepted",
  "in_production",
  "ready",
  "completed",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

export function canCreateOrder(role: string): boolean {
  return role === "owner" || role === "manager";
}

export function canManageDrafts(role: string): boolean {
  return canCreateOrder(role);
}
