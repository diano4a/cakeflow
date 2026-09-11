import { getLocale, getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/ui/page-header";
import { requireWorkspace } from "@/features/bakery/dal";
import { requireUser } from "@/lib/auth/dal";

export default async function OrdersPage() {
  const locale = await getLocale();
  await requireUser(locale);
  await requireWorkspace(locale);
  const t = await getTranslations("Orders");

  return (
    <section className="flex flex-col gap-layout">
      <PageHeader title={t("title")} description={t("placeholder")} />
    </section>
  );
}
