"use server";

import { hasLocale } from "next-intl";

import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { ensureOwnProfile, getCurrentUser } from "@/lib/auth/dal";
import { APP_HOME_PATH, SIGN_IN_PATH } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";

import { getCurrentWorkspace } from "./dal";
import type { CreateBakeryFormState } from "./types";

function readLocale(formData: FormData) {
  const value = String(formData.get("locale") ?? "");
  return hasLocale(routing.locales, value) ? value : routing.defaultLocale;
}

export async function createBakery(
  _previous: CreateBakeryFormState,
  formData: FormData,
): Promise<CreateBakeryFormState> {
  const locale = readLocale(formData);
  const user = await getCurrentUser();

  if (!user) {
    return redirect({ href: SIGN_IN_PATH, locale });
  }

  const existing = await getCurrentWorkspace();
  if (existing) {
    return redirect({ href: APP_HOME_PATH, locale });
  }

  // Display name only: spaces and Cyrillic are valid. Do not treat this as a slug.
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return {
      status: "error",
      fieldErrors: { name: "nameRequired" },
    };
  }

  const profileReady = await ensureOwnProfile();
  if (!profileReady) {
    return { status: "error", formError: "unexpected" };
  }

  const supabase = await createClient();

  // If a previous attempt created the bakery row but not the membership,
  // finish that bootstrap instead of inserting a second bakery.
  const { data: owned } = await supabase
    .from("bakeries")
    .select("id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (owned) {
    const { error: membershipError } = await supabase
      .from("bakery_members")
      .insert({
        bakery_id: owned.id,
        user_id: user.id,
        role: "owner",
      });

    if (membershipError && membershipError.code !== "23505") {
      console.error(
        "createBakery: failed to recover owner membership",
        membershipError,
      );
      return { status: "error", formError: "unexpected" };
    }

    return redirect({ href: APP_HOME_PATH, locale });
  }

  const { data: bakery, error: bakeryError } = await supabase
    .from("bakeries")
    .insert({ name, owner_id: user.id })
    .select("id")
    .single();

  if (bakeryError || !bakery) {
    console.error("createBakery: failed to insert bakery", bakeryError);
    return { status: "error", formError: "unexpected" };
  }

  const { error: membershipError } = await supabase.from("bakery_members").insert({
    bakery_id: bakery.id,
    user_id: user.id,
    role: "owner",
  });

  if (membershipError) {
    console.error("createBakery: failed to insert owner membership", membershipError);
    return { status: "error", formError: "unexpected" };
  }

  return redirect({ href: APP_HOME_PATH, locale });
}
