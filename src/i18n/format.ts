import { getFormatter } from "next-intl/server";

/**
 * Locale-aware date/time for CakeFlow UI.
 *
 * Use this (or `useFormatter` in client components) instead of
 * `toLocaleString` so the pattern follows the active `uk` / `en` locale.
 * Do not run user-entered bakery, catalog or order text through here.
 */
export async function formatDateTime(value: string | Date) {
  const format = await getFormatter();

  return format.dateTime(new Date(value), {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
