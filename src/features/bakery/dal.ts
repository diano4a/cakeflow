import "server-only";

import { cache } from "react";

import { redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { APP_HOME_PATH, ONBOARDING_PATH } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";

import { isBakeryRole, type BakeryMember, type Workspace } from "./types";

/**
 * Resolves the current bakery from membership. MVP is single-workspace: if a
 * user belongs to more than one bakery, the earliest membership wins.
 */
export const getCurrentWorkspace = cache(
  async (): Promise<Workspace | null> => {
    const user = await getCurrentUser();
    if (!user) {
      return null;
    }

    const supabase = await createClient();
    const { data: membership, error: membershipError } = await supabase
      .from("bakery_members")
      .select("role, bakery_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (membershipError) {
      console.error("getCurrentWorkspace: failed to read membership", membershipError);
      return null;
    }

    if (!membership || !isBakeryRole(membership.role)) {
      return null;
    }

    const { data: bakery, error: bakeryError } = await supabase
      .from("bakeries")
      .select("id, name, created_at")
      .eq("id", membership.bakery_id)
      .maybeSingle();

    if (bakeryError) {
      console.error("getCurrentWorkspace: failed to read bakery", bakeryError);
      return null;
    }

    if (!bakery) {
      return null;
    }

    return {
      bakery: {
        id: bakery.id,
        name: bakery.name,
        createdAt: bakery.created_at,
      },
      role: membership.role,
    };
  },
);

export async function requireWorkspace(locale: string): Promise<Workspace> {
  const workspace = await getCurrentWorkspace();

  if (!workspace) {
    return redirect({ href: ONBOARDING_PATH, locale });
  }

  return workspace;
}

export async function listBakeryMembers(
  bakeryId: string,
): Promise<BakeryMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bakery_members")
    .select("user_id, role, profiles(full_name)")
    .eq("bakery_id", bakeryId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("listBakeryMembers: failed to read members", error);
    return [];
  }

  return (data ?? []).flatMap((row) => {
    if (!isBakeryRole(row.role)) {
      return [];
    }

    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;

    return [
      {
        userId: row.user_id,
        fullName: profile?.full_name ?? null,
        role: row.role,
      },
    ];
  });
}

export async function requireOnboarding(locale: string): Promise<void> {
  const workspace = await getCurrentWorkspace();

  if (workspace) {
    return redirect({ href: APP_HOME_PATH, locale });
  }
}
