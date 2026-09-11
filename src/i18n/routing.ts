import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // "uk" is the ISO 639-1 code for Ukrainian ("ua" is the country code).
  locales: ["uk", "en"],
  defaultLocale: "uk",
});

export type Locale = (typeof routing.locales)[number];
