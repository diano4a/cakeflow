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

export function canCreateOrder(role: string): boolean {
  return role === "owner" || role === "manager";
}
