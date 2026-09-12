import { getLocale, getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/ui/page-header";
import { requireWorkspace } from "@/features/bakery/dal";
import { listOrders } from "@/features/orders/dal";
import { canCreateOrder } from "@/features/orders/types";
import { formatDateTime } from "@/i18n/format";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/dal";
import { ORDERS_NEW_PATH, ORDERS_PATH } from "@/lib/auth/routes";

export default async function OrdersPage() {
  const locale = await getLocale();
  await requireUser(locale);
  const workspace = await requireWorkspace(locale);
  const t = await getTranslations("Orders");
  const canCreate = canCreateOrder(workspace.role);
  const orders = await listOrders(workspace.bakery.id);
  const rows = await Promise.all(
    orders.map(async (order) => ({
      ...order,
      deadline: await formatDateTime(order.deadlineAt),
    })),
  );

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
      {rows.length === 0 ? (
        <p className="type-body text-muted">{t("empty")}</p>
      ) : (
        <ul className="divide-y divide-hairline hairline-t">
          {rows.map((order) => (
            <li key={order.id}>
              <Link
                href={`${ORDERS_PATH}/${order.id}`}
                className="grid gap-cluster py-row-y hover:text-ink"
              >
                <span className="type-value">{order.productType}</span>
                <span className="type-data text-muted">
                  {t(`statuses.${order.status}`)} · {order.deadline}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
