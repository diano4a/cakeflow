import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { routing } from "@/i18n/routing";
import {
  APP_HOME_PATH,
  SIGN_IN_PATH,
  isAuthPath,
  isProtectedPath,
} from "@/lib/auth/routes";
import { refreshSession } from "@/lib/supabase/proxy";

const handleLocaleRouting = createIntlMiddleware(routing);

/** Splits `/uk/orders` into the locale and the locale-independent path. */
function splitLocale(pathname: string) {
  const [, maybeLocale, ...rest] = pathname.split("/");
  const locale = routing.locales.find((candidate) => candidate === maybeLocale);

  return {
    locale: locale ?? routing.defaultLocale,
    pathname: locale ? `/${rest.join("/")}` : pathname,
  };
}

export default async function proxy(request: NextRequest) {
  const session = await refreshSession(request);
  const { locale, pathname } = splitLocale(request.nextUrl.pathname);

  if (isProtectedPath(pathname) && !session.isAuthenticated) {
    const target = request.nextUrl.clone();
    target.pathname = `/${locale}${SIGN_IN_PATH}`;
    // Remember where they were heading so sign-in can send them back.
    target.search = "";
    target.searchParams.set("redirectTo", pathname);
    return session.applyTo(NextResponse.redirect(target));
  }

  if (isAuthPath(pathname) && session.isAuthenticated) {
    const target = request.nextUrl.clone();
    target.pathname = `/${locale}${APP_HOME_PATH}`;
    target.search = "";
    return session.applyTo(NextResponse.redirect(target));
  }

  return session.applyTo(handleLocaleRouting(request));
}

export const config = {
  // Everything except API routes, Next internals and files with an extension.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
