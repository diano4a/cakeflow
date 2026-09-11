import {
  ORDERS_PATH,
  OVERVIEW_PATH,
  PRODUCTION_PATH,
  SETTINGS_PATH,
} from "@/lib/auth/routes";

export const APP_NAV_ITEMS = [
  { href: ORDERS_PATH, key: "orders" },
  { href: PRODUCTION_PATH, key: "production" },
  { href: OVERVIEW_PATH, key: "overview" },
  { href: SETTINGS_PATH, key: "settings" },
] as const;
