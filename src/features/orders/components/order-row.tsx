import { StatusText } from "@/components/ui/status-text";
import { Link } from "@/i18n/navigation";
import { ORDERS_PATH } from "@/lib/auth/routes";

import type { DateFilter, ListOrder, MeasurementPart, StatusFilter } from "../list";
import { isOrderStatus } from "../types";
import { DeleteDraftDialog } from "./delete-draft-dialog";

export function OrderRow({
  order,
  statusLabel,
  timeLabel,
  measurement,
  numberLabel,
  canManageDrafts,
  filters,
  labels,
}: {
  order: ListOrder;
  statusLabel: string;
  timeLabel: string | null;
  measurement: string | null;
  numberLabel: string;
  canManageDrafts: boolean;
  filters: { status: StatusFilter; date: DateFilter };
  labels: {
    open: string;
    edit: string;
  };
}) {
  const isDraft = order.status === "draft";
  const statusEmphasis =
    order.status === "in_production" || order.status === "ready"
      ? "strong"
      : isDraft
        ? "quiet"
        : "default";

  return (
    <article className="hairline-b">
      <Link
        href={`${ORDERS_PATH}/${order.id}`}
        aria-label={labels.open}
        className="hover:bg-tile focus-visible:bg-tile grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] gap-x-layout gap-y-cluster py-row-y sm:grid-cols-[auto_minmax(0,1fr)_auto_auto_auto] sm:items-baseline"
      >
        <span className="type-data">{numberLabel}</span>
        <span className="type-data text-muted sm:order-last" aria-hidden>
          →
        </span>
        <span className="col-span-2 grid min-w-0 gap-cluster sm:col-span-1">
          <span className="type-value break-words">{order.productType}</span>
          {measurement ? (
            <span className="type-data text-muted">{measurement}</span>
          ) : null}
          {order.assigneeName ? (
            <span className="type-data text-muted">{order.assigneeName}</span>
          ) : null}
        </span>
        <span className="col-span-2 flex min-w-0 flex-wrap items-baseline gap-cluster sm:contents">
          {timeLabel ? <span className="type-data">{timeLabel}</span> : null}
          {isOrderStatus(order.status) ? (
            <StatusText emphasis={statusEmphasis}>{statusLabel}</StatusText>
          ) : (
            <span className="type-label">{statusLabel}</span>
          )}
        </span>
      </Link>
      {isDraft && canManageDrafts ? (
        <div className="flex flex-wrap items-center gap-layout pb-row-y">
          <Link
            href={`${ORDERS_PATH}/${order.id}`}
            className="type-body inline-flex min-h-control items-center underline decoration-hairline underline-offset-4 hover:decoration-ink focus-visible:bg-tile"
          >
            {labels.edit}
          </Link>
          <DeleteDraftDialog
            orderId={order.id}
            orderLabel={`${numberLabel} · ${order.productType}`}
            status={filters.status}
            date={filters.date}
          />
        </div>
      ) : null}
    </article>
  );
}

export function formatMeasurementSummary(
  parts: MeasurementPart[],
  labels: { kg: (value: number) => string; pcs: (count: number) => string },
): string | null {
  if (parts.length === 0) {
    return null;
  }

  return parts
    .map((part) => {
      if (part.kind === "weight") {
        return labels.kg(part.value);
      }
      if (part.kind === "quantity") {
        return labels.pcs(part.value);
      }
      return part.value;
    })
    .join(" · ");
}
