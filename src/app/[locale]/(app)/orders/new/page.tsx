import { getLocale, getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/ui/page-header";
import { listBakeryMembers, requireWorkspace } from "@/features/bakery/dal";
import { listCatalogOptionsForOrder } from "@/features/catalog/dal";
import { CreateOrderForm } from "@/features/orders/components/create-order-form";
import { canCreateOrder } from "@/features/orders/types";
import { Link, redirect } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/dal";
import { ORDERS_PATH } from "@/lib/auth/routes";

export default async function NewOrderPage() {
  const locale = await getLocale();
  await requireUser(locale);
  const workspace = await requireWorkspace(locale);
  const t = await getTranslations("Orders");
  const overviewT = await getTranslations("Overview");

  if (!canCreateOrder(workspace.role)) {
    return redirect({ href: ORDERS_PATH, locale });
  }

  const [catalog, members] = await Promise.all([
    listCatalogOptionsForOrder(workspace.bakery.id),
    listBakeryMembers(workspace.bakery.id),
  ]);

  const assignees = members.map((member) => ({
    id: member.userId,
    label: member.fullName ?? overviewT(`roles.${member.role}`),
  }));

  return (
    <section className="brief flex flex-col gap-layout">
      <p className="md:hidden">
        <Link href={ORDERS_PATH} className="type-label hover:text-ink">
          ← {t("back")}
        </Link>
      </p>
      <PageHeader title={t("createTitle")} description={t("createDescription")} />
      <CreateOrderForm
        productTypes={catalog.filter((option) => option.kind === "product_type")}
        fillings={catalog.filter((option) => option.kind === "filling")}
        shapes={catalog.filter((option) => option.kind === "shape")}
        sizes={catalog.filter((option) => option.kind === "size")}
        assignees={assignees}
      />
    </section>
  );
}
