import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // "uk" is the ISO 639-1 code for Ukrainian ("ua" is the country code).
  locales: ["en", "uk"],
  defaultLocale: "en",
});

export type Locale = (typeof routing.locales)[number];
