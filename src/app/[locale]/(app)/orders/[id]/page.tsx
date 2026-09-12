import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/ui/page-header";
import { SpecList, SpecRow } from "@/components/ui/spec-row";
import { requireWorkspace } from "@/features/bakery/dal";
import { getOrder, listOrderReferences } from "@/features/orders/dal";
import { OrderReferenceAddForm } from "@/features/orders/components/order-reference-add-form";
import { OrderReferenceGallery } from "@/features/orders/components/order-reference-gallery";
import { canCreateOrder } from "@/features/orders/types";
import { formatDateTime } from "@/i18n/format";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/dal";
import { ORDERS_PATH } from "@/lib/auth/routes";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await getLocale();
  await requireUser(locale);
  const workspace = await requireWorkspace(locale);
  const t = await getTranslations("Orders");
  const order = await getOrder(workspace.bakery.id, id);

  if (!order) {
    notFound();
  }

  const references = await listOrderReferences(workspace.bakery.id, order.id);
  const canManage = canCreateOrder(workspace.role);
  const deadline = await formatDateTime(order.deadlineAt);

  return (
    <section className="brief flex flex-col gap-layout">
      <p className="md:hidden">
        <Link href={ORDERS_PATH} className="type-label hover:text-ink">
          ← {t("back")}
        </Link>
      </p>
      <PageHeader title={order.productType} description={t("detailDescription")} />
      <SpecList>
        <SpecRow label={t("fields.status")} data>
          {t(`statuses.${order.status}`)}
        </SpecRow>
        <SpecRow label={t("fields.deadline")} data>
          {deadline}
        </SpecRow>
        {order.quantity !== null ? (
          <SpecRow label={t("fields.quantity")} data>
            {order.quantity}
          </SpecRow>
        ) : null}
        {order.weightKg !== null ? (
          <SpecRow label={t("fields.weight")} data>
            {order.weightKg}
          </SpecRow>
        ) : null}
      </SpecList>
      <div className="grid gap-cluster">
        <h2 className="type-label">{t("sections.references")}</h2>
        <OrderReferenceGallery
          orderId={order.id}
          references={references}
          canManage={canManage}
        />
        {canManage ? (
          <OrderReferenceAddForm
            orderId={order.id}
            attachedCount={references.length}
          />
        ) : null}
      </div>
    </section>
  );
}
