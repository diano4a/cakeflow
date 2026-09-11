/** Mirrors minimum_password_length in supabase/config.toml. */
export const MIN_PASSWORD_LENGTH = 6;

/** Values are message keys under `Auth.errors`, not user-facing text. */
export type AuthFormState = {
  status: "idle" | "error" | "confirmation-required";
  formError?: string;
  fieldErrors?: {
    email?: string;
    password?: string;
  };
};

export const initialAuthFormState: AuthFormState = { status: "idle" };
