import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

type PendingCookie = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export type SessionRefresh = {
  /** True when the request carries a valid, signature-verified access token. */
  isAuthenticated: boolean;
  /**
   * Copies the refreshed auth cookies and the cache headers that keep CDNs
   * from caching one user's session onto the response being returned.
   */
  applyTo: (response: NextResponse) => NextResponse;
};

/**
 * Refreshes the Supabase auth token during the proxy pass.
 *
 * Server Components cannot write cookies, so the refreshed token has to be
 * written here: onto the request (so the rest of this render sees it) and onto
 * the response (so the browser replaces the old one).
 */
export async function refreshSession(
  request: NextRequest,
): Promise<SessionRefresh> {
  const pendingCookies: PendingCookie[] = [];
  const cacheHeaders: Record<string, string> = {};

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const cookie of cookiesToSet) {
            request.cookies.set(cookie.name, cookie.value);
            pendingCookies.push(cookie);
          }
          Object.assign(cacheHeaders, headers ?? {});
        },
      },
    },
  );

  // getClaims verifies the JWT signature, unlike getSession, so its result is
  // safe to base a redirect on.
  const { data, error } = await supabase.auth.getClaims();

  return {
    isAuthenticated: !error && Boolean(data?.claims),
    applyTo(response) {
      for (const { name, value, options } of pendingCookies) {
        response.cookies.set(name, value, options);
      }
      for (const [key, value] of Object.entries(cacheHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    },
  };
}
