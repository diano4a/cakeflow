import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // "uk" is the ISO 639-1 code for Ukrainian ("ua" is the country code).
  locales: ["uk", "en"],
  defaultLocale: "uk",
  // Ukrainian is the initial-market default. The URL is the source of truth
  // after a user switches; do not send first-time visitors to English via
  // Accept-Language.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
