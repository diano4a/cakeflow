import "server-only";

import { cache } from "react";

import { redirect } from "@/i18n/navigation";
import { SIGN_IN_PATH } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";

export type AuthenticatedUser = {
  id: string;
  email: string;
};

/**
 * The proxy redirect is an optimistic check. This is the authoritative one and
 * belongs in every protected layout or page, close to the data it guards.
 *
 * Memoized per render pass so several components can call it cheaply.
 */
export const getCurrentUser = cache(
  async (): Promise<AuthenticatedUser | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();

    const claims = data?.claims;
    if (error || !claims?.sub) {
      return null;
    }

    return {
      id: claims.sub,
      email: typeof claims.email === "string" ? claims.email : "",
    };
  },
);

export async function requireUser(locale: string): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();

  if (!user) {
    return redirect({ href: SIGN_IN_PATH, locale });
  }

  return user;
}
