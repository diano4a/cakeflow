import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { SETTINGS_PATH } from "@/lib/auth/routes";

export async function SettingsBackLink() {
  const t = await getTranslations("Settings");

  return (
    <p className="md:hidden">
      <Link href={SETTINGS_PATH} className="type-label hover:text-ink">
        ← {t("back")}
      </Link>
    </p>
  );
}
