/** Locale-independent paths, i.e. without the `/en` or `/uk` prefix. */
export const SIGN_IN_PATH = "/sign-in";
export const SIGN_UP_PATH = "/sign-up";
export const ONBOARDING_PATH = "/onboarding";
export const ORDERS_PATH = "/orders";
export const PRODUCTION_PATH = "/production";
export const OVERVIEW_PATH = "/overview";
export const SETTINGS_PATH = "/settings";
/** Legacy alias from KAN-10. Resolves into the app shell. */
export const DASHBOARD_PATH = "/dashboard";

/** First screen after a bakery exists. Orders is the daily work surface. */
export const APP_HOME_PATH = ORDERS_PATH;

const AUTH_PATHS = [SIGN_IN_PATH, SIGN_UP_PATH];
const PROTECTED_PATHS = [
  ONBOARDING_PATH,
  ORDERS_PATH,
  PRODUCTION_PATH,
  OVERVIEW_PATH,
  SETTINGS_PATH,
  DASHBOARD_PATH,
];

function matches(pathname: string, paths: string[]) {
  return paths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/** Requires a session. Unauthenticated visitors are sent to sign in. */
export function isProtectedPath(pathname: string) {
  return matches(pathname, PROTECTED_PATHS);
}

/** Sign in / sign up. Authenticated visitors are sent into the app. */
export function isAuthPath(pathname: string) {
  return matches(pathname, AUTH_PATHS);
}
