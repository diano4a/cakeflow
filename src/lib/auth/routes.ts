/** Locale-independent paths, i.e. without the `/en` or `/uk` prefix. */
export const SIGN_IN_PATH = "/sign-in";
export const SIGN_UP_PATH = "/sign-up";
export const DASHBOARD_PATH = "/dashboard";

const AUTH_PATHS = [SIGN_IN_PATH, SIGN_UP_PATH];
const PROTECTED_PATHS = [DASHBOARD_PATH];

function matches(pathname: string, paths: string[]) {
  return paths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/** Requires a session. Unauthenticated visitors are sent to sign in. */
export function isProtectedPath(pathname: string) {
  return matches(pathname, PROTECTED_PATHS);
}

/** Sign in / sign up. Authenticated visitors are sent to the dashboard. */
export function isAuthPath(pathname: string) {
  return matches(pathname, AUTH_PATHS);
}
