import { getLocale, getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { requireWorkspace } from "@/features/bakery/dal";
import {
  OrderCard,
  formatMeasurementSummary,
} from "@/features/orders/components/order-card";
import { OrdersFilters } from "@/features/orders/components/orders-filters";
import { listOrders } from "@/features/orders/dal";
import { BAKERY_TIME_ZONE } from "@/features/orders/deadline";
import {
  buildOrdersList,
  isOverdueOrder,
  measurementParts,
  parseDateFilter,
  parseListError,
  parseListNotice,
  parseStatusFilter,
  type ListOrder,
  type ProductionGroup,
} from "@/features/orders/list";
import { canCreateOrder, canManageDrafts, isOrderStatus } from "@/features/orders/types";
import { formatDateHeading, formatDeadlineLine } from "@/i18n/format";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/dal";
import { ORDERS_NEW_PATH, ORDERS_PATH } from "@/lib/auth/routes";

function firstString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function headingInstant(ymd: string) {
  return new Date(`${ymd}T12:00:00.000Z`);
}

function groupHeading(
  group: Pick<ProductionGroup, "relative" | "ymd">,
  dateLabel: string | null,
  labels: {
    today: string;
    tomorrow: string;
    overdue: string;
    none: string;
  },
) {
  if (group.relative === "none" || !dateLabel) {
    return labels.none;
  }
  if (group.relative === "today") {
    return `${labels.today} · ${dateLabel}`;
  }
  if (group.relative === "tomorrow") {
    return `${labels.tomorrow} · ${dateLabel}`;
  }
  if (group.relative === "overdue") {
    return `${labels.overdue} · ${dateLabel}`;
  }
  return dateLabel;
}

async function presentOrder(
  order: ListOrder,
  t: Awaited<ReturnType<typeof getTranslations>>,
  now: Date,
) {
  return {
    order,
    deadlineLabel: order.deadlineAt
      ? await formatDeadlineLine(order.deadlineAt)
      : null,
    measurement: formatMeasurementSummary(measurementParts(order), {
      kg: (value) => t("measurement.kg", { value }),
      pcs: (count) => t("measurement.pcs", { count }),
    }),
    numberLabel: t("orderNumber", { number: order.orderNumber }),
    statusLabel: isOrderStatus(order.status)
      ? t(`statuses.${order.status}`)
      : order.status,
    overdue: isOverdueOrder(order, now, BAKERY_TIME_ZONE),
  };
}

export default async function OrdersPage({
  searchParams,
}: PageProps<"/[locale]/orders">) {
  const params = await searchParams;
  const locale = await getLocale();
  await requireUser(locale);
  const workspace = await requireWorkspace(locale);
  const t = await getTranslations("Orders");
  const canCreate = canCreateOrder(workspace.role);
  const canManage = canManageDrafts(workspace.role);
  const status = parseStatusFilter(firstString(params.status));
  const date = parseDateFilter(firstString(params.date));
  const notice = parseListNotice(firstString(params.notice));
  const listError = parseListError(firstString(params.error));
  const now = new Date();
  const orders = await listOrders(workspace.bakery.id);
  const model = buildOrdersList(orders, { status, date }, now, BAKERY_TIME_ZONE);
  const filters = { status, date };
  const resetHref = ORDERS_PATH;

  const groups = await Promise.all(
    model.groups.map(async (group) => ({
      ...group,
      dateLabel: group.ymd
        ? await formatDateHeading(headingInstant(group.ymd))
        : null,
      orders: await Promise.all(
        group.orders.map((order) => presentOrder(order, t, now)),
      ),
    })),
  );

  const drafts = await Promise.all(
    model.drafts.map((order) => presentOrder(order, t, now)),
  );
  const visibleCount =
    groups.reduce((total, group) => total + group.orders.length, 0) +
    drafts.length;

  return (
    <section className="flex flex-col gap-layout">
      <div className="flex flex-col gap-cluster sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title={t("title")} />
        {canCreate ? (
          <Button asChild variant="outline">
            <Link href={ORDERS_NEW_PATH}>{t("new")}</Link>
          </Button>
        ) : null}
      </div>

      {notice === "draftDeleted" ? (
        <p className="type-body">{t("draftDeleted")}</p>
      ) : null}
      {listError ? (
        <p className="type-body">{t(`errors.${listError}`)}</p>
      ) : null}

      {model.emptyKind !== "bakery" ? (
        <OrdersFilters
          status={status}
          date={date}
          countLabel={t("orderCount", { count: visibleCount })}
        />
      ) : null}

      {model.emptyKind === "bakery" ? (
        <div className="grid gap-cluster">
          <p className="type-body text-muted measure">{t("empty")}</p>
          {canCreate ? (
            <p>
              <Link
                href={ORDERS_NEW_PATH}
                className="type-body underline decoration-hairline underline-offset-4 hover:decoration-ink"
              >
                {t("new")}
              </Link>
            </p>
          ) : null}
        </div>
      ) : null}

      {model.emptyKind === "filtered" ? (
        <div className="grid gap-cluster">
          <p className="type-body text-muted measure">{t("emptyFiltered")}</p>
          <p>
            <Link
              href={resetHref}
              className="type-body underline decoration-hairline underline-offset-4 hover:decoration-ink"
            >
              {t("resetFilters")}
            </Link>
          </p>
        </div>
      ) : null}

      {model.emptyKind === "drafts" ? (
        <div className="grid gap-cluster">
          <p className="type-body text-muted measure">{t("emptyDrafts")}</p>
          <p>
            <Link
              href={resetHref}
              className="type-body underline decoration-hairline underline-offset-4 hover:decoration-ink"
            >
              {t("resetFilters")}
            </Link>
          </p>
        </div>
      ) : null}

      {model.emptyKind === "none" ? (
        <div className="flex flex-col gap-layout">
          {groups.map((group) => (
            <section key={group.key} className="flex flex-col gap-layout">
              <div className="divider-b flex items-baseline justify-between gap-layout pb-cluster">
                <h2 className="type-label">
                  {groupHeading(group, group.dateLabel, {
                    today: t("groups.today"),
                    tomorrow: t("groups.tomorrow"),
                    overdue: t("groups.overdue"),
                    none: t("groups.none"),
                  })}
                </h2>
                <p className="type-label">
                  {t("orderCount", { count: group.orders.length })}
                </p>
              </div>
              <div className="order-card-grid">
                {group.orders.map((row) => (
                  <OrderCard
                    key={row.order.id}
                    order={row.order}
                    statusLabel={row.statusLabel}
                    deadlineLabel={row.deadlineLabel}
                    measurement={row.measurement}
                    numberLabel={row.numberLabel}
                    overdue={row.overdue}
                    overdueLabel={t("overdue")}
                    canManageDrafts={canManage}
                    filters={filters}
                    labels={{
                      open: t("openOrder", {
                        number: row.order.orderNumber,
                        product: row.order.productType,
                      }),
                      edit: t("editDraft"),
                    }}
                  />
                ))}
              </div>
            </section>
          ))}

          {drafts.length > 0 ? (
            <section className="flex flex-col gap-layout">
              <div className="divider-b flex items-baseline justify-between gap-layout pb-cluster">
                <h2 className="type-label">{t("groups.drafts")}</h2>
                <p className="type-label">
                  {t("orderCount", { count: drafts.length })}
                </p>
              </div>
              <div className="order-card-grid">
                {drafts.map((row) => (
                  <OrderCard
                    key={row.order.id}
                    order={row.order}
                    statusLabel={row.statusLabel}
                    deadlineLabel={row.deadlineLabel}
                    measurement={row.measurement}
                    numberLabel={row.numberLabel}
                    overdue={false}
                    overdueLabel={t("overdue")}
                    canManageDrafts={canManage}
                    filters={filters}
                    labels={{
                      open: t("openOrder", {
                        number: row.order.orderNumber,
                        product: row.order.productType,
                      }),
                      edit: t("editDraft"),
                    }}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
