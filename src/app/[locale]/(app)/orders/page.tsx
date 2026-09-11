import { getLocale, getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/ui/page-header";
import { requireWorkspace } from "@/features/bakery/dal";
import { canCreateOrder } from "@/features/orders/types";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/dal";
import { ORDERS_NEW_PATH } from "@/lib/auth/routes";

export default async function OrdersPage() {
  const locale = await getLocale();
  await requireUser(locale);
  const workspace = await requireWorkspace(locale);
  const t = await getTranslations("Orders");
  const canCreate = canCreateOrder(workspace.role);

  return (
    <section className="flex flex-col gap-layout">
      <div className="flex flex-col gap-cluster sm:flex-row sm:items-baseline sm:justify-between">
        <PageHeader title={t("title")} description={t("placeholder")} />
        {canCreate ? (
          <Link href={ORDERS_NEW_PATH} className="type-body shrink-0 hover:text-ink">
            {t("new")}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
