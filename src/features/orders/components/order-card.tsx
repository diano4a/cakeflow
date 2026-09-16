import { StatusDot, statusToneFor } from "@/components/ui/status-dot";
import { StatusText } from "@/components/ui/status-text";
import { Link } from "@/i18n/navigation";
import { ORDERS_PATH } from "@/lib/auth/routes";

import type {
  DateFilter,
  ListOrder,
  MeasurementPart,
  StatusFilter,
} from "../list";
import { isOrderStatus } from "../types";
import { DeleteDraftDialog } from "./delete-draft-dialog";

export function OrderCard({
  order,
  statusLabel,
  deadlineLabel,
  measurement,
  numberLabel,
  overdue,
  overdueLabel,
  canManageDrafts,
  filters,
  labels,
}: {
  order: ListOrder;
  statusLabel: string;
  deadlineLabel: string | null;
  measurement: string | null;
  numberLabel: string;
  overdue: boolean;
  overdueLabel: string;
  canManageDrafts: boolean;
  filters: { status: StatusFilter; date: DateFilter };
  labels: {
    open: string;
    edit: string;
  };
}) {
  const isDraft = order.status === "draft";
  const tone = statusToneFor(order.status, overdue);
  const indicatorLabel = overdue ? overdueLabel : statusLabel;

  return (
    <article className="group border-hairline bg-paper hover:border-ink hover:bg-tile focus-within:border-ink flex min-w-0 flex-col overflow-hidden border sm:aspect-square">
      <Link
        href={`${ORDERS_PATH}/${order.id}`}
        aria-label={labels.open}
        className="flex min-h-0 min-w-0 flex-1 cursor-pointer flex-col gap-cluster p-layout"
      >
        <span className="flex items-start justify-between gap-cluster">
          <span className="type-data min-w-0">{numberLabel}</span>
          <StatusDot tone={tone} label={indicatorLabel} />
        </span>
        <span className="grid min-w-0 gap-cluster">
          <span className="type-heading break-words">{order.productType}</span>
          {measurement ? (
            <span className="type-data text-muted">{measurement}</span>
          ) : null}
        </span>
        <span className="mt-auto grid min-w-0 gap-cluster">
          {deadlineLabel ? (
            <span className="type-data">{deadlineLabel}</span>
          ) : null}
          {isOrderStatus(order.status) ? (
            <StatusText emphasis={isDraft ? "quiet" : "default"}>
              {statusLabel}
            </StatusText>
          ) : (
            <span className="type-label">{statusLabel}</span>
          )}
          {overdue ? (
            <StatusText emphasis="strong">{overdueLabel}</StatusText>
          ) : null}
          {order.assigneeName ? (
            <span className="type-data text-muted">{order.assigneeName}</span>
          ) : null}
        </span>
      </Link>
      {isDraft && canManageDrafts ? (
        <div className="flex flex-wrap items-center justify-between gap-cluster px-layout pb-layout">
          <Link
            href={`${ORDERS_PATH}/${order.id}`}
            className="type-body inline-flex min-h-control items-center underline decoration-hairline underline-offset-4 hover:decoration-ink"
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
