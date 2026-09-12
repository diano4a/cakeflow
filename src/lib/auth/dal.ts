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
 * The proxy redirect only checks that the JWT signature is valid. This is the
 * authoritative session: Auth must still have the user. A signed JWT can
 * outlive a local database reset or a deleted account; those visitors are
 * unauthenticated here so they are sent to sign-in instead of onboarding.
 *
 * Memoized per render pass so several components can call it cheaply.
 */
export const getCurrentUser = cache(
  async (): Promise<AuthenticatedUser | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return null;
    }

    return {
      id: data.user.id,
      email: data.user.email ?? "",
    };
  },
);

/**
 * bakeries.owner_id and bakery_members.user_id both reference profiles.
 * Sign-up normally creates that row via handle_new_user; this covers the
 * case where the auth user exists but the profile insert never landed.
 */
export async function ensureOwnProfile(fullName?: string | null) {
  const user = await getCurrentUser();
  if (!user) {
    return false;
  }

  const supabase = await createClient();
  const { data: existing, error: readError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (readError) {
    console.error("ensureOwnProfile: failed to read profile", readError);
    return false;
  }

  if (existing) {
    return true;
  }

  const { error: insertError } = await supabase.from("profiles").insert({
    id: user.id,
    full_name: fullName?.trim() || null,
  });

  if (insertError) {
    console.error("ensureOwnProfile: failed to insert profile", insertError);
    return false;
  }

  return true;
}

export async function requireUser(locale: string): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();

  if (!user) {
    return redirect({ href: SIGN_IN_PATH, locale });
  }

  return user;
}
