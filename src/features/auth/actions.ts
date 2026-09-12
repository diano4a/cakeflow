"use server";

import { hasLocale } from "next-intl";

import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  APP_HOME_PATH,
  ONBOARDING_PATH,
  SIGN_IN_PATH,
  isProtectedPath,
} from "@/lib/auth/routes";
import { ensureOwnProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

import { MIN_PASSWORD_LENGTH, type AuthFormState } from "./types";

/**
 * Message keys under `Auth.errors`. Returning keys rather than sentences keeps
 * the localization in the components and out of the server actions.
 */
function mapAuthError(code: string | undefined, status: number | undefined) {
  switch (code) {
    case "invalid_credentials":
      return "invalidCredentials";
    case "email_not_confirmed":
      return "emailNotConfirmed";
    case "user_already_exists":
    case "email_exists":
      return "userAlreadyExists";
    case "weak_password":
      return "weakPassword";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "rateLimited";
    default:
      return status === 429 ? "rateLimited" : "unexpected";
  }
}

/**
 * The locale travels in a hidden form field because binding it to the action
 * instead leaves the request hanging on Next.js 16.3.4.
 */
function readLocale(formData: FormData) {
  const value = String(formData.get("locale") ?? "");
  return hasLocale(routing.locales, value) ? value : routing.defaultLocale;
}

function readCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fieldErrors: AuthFormState["fieldErrors"] = {};

  if (!email) {
    fieldErrors.email = "emailRequired";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = "emailInvalid";
  }

  if (!password) {
    fieldErrors.password = "passwordRequired";
  }

  return { email, password, fieldErrors };
}

/** Only same-origin, locale-independent app paths may be redirect targets. */
function safeRedirectPath(value: FormDataEntryValue | null) {
  const candidate = String(value ?? "");
  if (
    candidate.startsWith("/") &&
    !candidate.startsWith("//") &&
    isProtectedPath(candidate)
  ) {
    return candidate;
  }
  return APP_HOME_PATH;
}

export async function signIn(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const locale = readLocale(formData);
  const { email, password, fieldErrors } = readCredentials(formData);

  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      status: "error",
      formError: mapAuthError(error.code, error.status),
    };
  }

  await ensureOwnProfile();

  return redirect({
    href: safeRedirectPath(formData.get("redirectTo")),
    locale,
  });
}

export async function signUp(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const locale = readLocale(formData);
  const { email, password, fieldErrors } = readCredentials(formData);
  const fullName = String(formData.get("fullName") ?? "").trim();

  if (password && password.length < MIN_PASSWORD_LENGTH) {
    fieldErrors.password = "passwordTooShort";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", fieldErrors };
  }

  const supabase = await createClient();
  // full_name is picked up by the KAN-9 handle_new_user trigger, which creates
  // the matching public.profiles row.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: fullName ? { data: { full_name: fullName } } : undefined,
  });

  if (error) {
    return {
      status: "error",
      formError: mapAuthError(error.code, error.status),
    };
  }

  // With email confirmation enabled there is no session yet, so the user has to
  // confirm before signing in. Locally confirmation is off and a session is
  // returned immediately.
  if (!data.session) {
    return { status: "confirmation-required" };
  }

  await ensureOwnProfile(fullName);

  return redirect({ href: ONBOARDING_PATH, locale });
}

export async function signOut(formData: FormData) {
  const locale = readLocale(formData);
  const supabase = await createClient();
  await supabase.auth.signOut();

  return redirect({ href: SIGN_IN_PATH, locale });
}
