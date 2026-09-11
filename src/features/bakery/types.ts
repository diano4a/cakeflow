export type BakeryRole = "owner" | "manager" | "baker";

export type Workspace = {
  bakery: {
    id: string;
    name: string;
    createdAt: string;
  };
  role: BakeryRole;
};

/** Values are message keys under `Onboarding.errors`, not user-facing text. */
export type CreateBakeryFormState = {
  status: "idle" | "error";
  formError?: string;
  fieldErrors?: {
    name?: string;
  };
};

export const initialCreateBakeryFormState: CreateBakeryFormState = {
  status: "idle",
};

export function isBakeryRole(value: string): value is BakeryRole {
  return value === "owner" || value === "manager" || value === "baker";
}
