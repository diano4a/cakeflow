import { getLocale, getTranslations } from "next-intl/server";

import { requireWorkspace } from "@/features/bakery/dal";
import { requireUser } from "@/lib/auth/dal";

export default async function OrdersPage() {
  const locale = await getLocale();
  await requireUser(locale);
  await requireWorkspace(locale);
  const t = await getTranslations("Orders");

  return (
    <section>
      <h1 className="type-heading">{t("title")}</h1>
      <p className="type-body text-muted measure mt-5">{t("placeholder")}</p>
    </section>
  );
}
