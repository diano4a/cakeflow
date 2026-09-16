export const DATE_FILTERS = [
  "all",
  "today",
  "tomorrow",
  "week",
  "overdue",
] as const;

export type DateFilter = (typeof DATE_FILTERS)[number];
export type StatusFilter =
  | "all"
  | "draft"
  | "submitted"
  | "accepted"
  | "in_production"
  | "ready"
  | "completed"
  | "cancelled";

export type MeasurementPart =
  | { kind: "weight"; value: number }
  | { kind: "size"; value: string }
  | { kind: "quantity"; value: number };

export type DateGroupRelative = "today" | "tomorrow" | "overdue" | "future";

export type OrdersListNotice = "draftDeleted";
export type OrdersListError =
  | "deleteForbidden"
  | "deleteNotDraft"
  | "deleteFailed"
  | "notFound";

const NOTICE_VALUES = new Set<OrdersListNotice>(["draftDeleted"]);
const ERROR_VALUES = new Set<OrdersListError>([
  "deleteForbidden",
  "deleteNotDraft",
  "deleteFailed",
  "notFound",
]);

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STATUS_VALUES = new Set<Exclude<StatusFilter, "all">>([
  "draft",
  "submitted",
  "accepted",
  "in_production",
  "ready",
  "completed",
  "cancelled",
]);
const SETTLED_STATUSES = new Set<StatusFilter>(["completed", "cancelled"]);

export type ListOrder = {
  id: string;
  orderNumber: number;
  productType: string;
  status: string;
  deadlineAt: string | null;
  updatedAt: string;
  quantity: number | null;
  weightKg: number | null;
  sizeNote: string | null;
  assigneeName: string | null;
};

export type ProductionGroup = {
  key: string;
  ymd: string | null;
  relative: DateGroupRelative | "none";
  orders: ListOrder[];
};

export type OrdersListModel = {
  totalCount: number;
  hasActiveFilters: boolean;
  emptyKind: "none" | "bakery" | "filtered" | "drafts";
  groups: ProductionGroup[];
  drafts: ListOrder[];
};

export function parseStatusFilter(raw: string | undefined): StatusFilter {
  if (!raw || raw === "all") {
    return "all";
  }
  return STATUS_VALUES.has(raw as Exclude<StatusFilter, "all">)
    ? (raw as StatusFilter)
    : "all";
}

export function parseDateFilter(raw: string | undefined): DateFilter {
  if (!raw || raw === "all") {
    return "all";
  }
  return (DATE_FILTERS as readonly string[]).includes(raw)
    ? (raw as DateFilter)
    : "all";
}

export function parseListNotice(
  raw: string | undefined,
): OrdersListNotice | null {
  if (!raw) {
    return null;
  }
  return NOTICE_VALUES.has(raw as OrdersListNotice)
    ? (raw as OrdersListNotice)
    : null;
}

export function parseListError(raw: string | undefined): OrdersListError | null {
  if (!raw) {
    return null;
  }
  return ERROR_VALUES.has(raw as OrdersListError)
    ? (raw as OrdersListError)
    : null;
}

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function bakeryCalendarDate(
  instant: Date | string,
  timeZone: string,
): string | null {
  const date = typeof instant === "string" ? new Date(instant) : instant;
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  if (!year || !month || !day) {
    return null;
  }

  return `${year}-${month}-${day}`;
}

export function addCalendarDays(ymd: string, days: number): string {
  const [year, month, day] = ymd.split("-").map(Number);
  const utc = Date.UTC(year, month - 1, day + days);
  return new Date(utc).toISOString().slice(0, 10);
}

export function startOfIsoWeek(ymd: string): string {
  const [year, month, day] = ymd.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const mondayOffset = (weekday + 6) % 7;
  return addCalendarDays(ymd, -mondayOffset);
}

export function dateGroupRelative(
  ymd: string,
  todayYmd: string,
): DateGroupRelative {
  if (ymd === todayYmd) {
    return "today";
  }
  if (ymd === addCalendarDays(todayYmd, 1)) {
    return "tomorrow";
  }
  if (ymd < todayYmd) {
    return "overdue";
  }
  return "future";
}

export function matchesDateFilter(
  order: Pick<ListOrder, "deadlineAt" | "status">,
  filter: DateFilter,
  now: Date,
  timeZone: string,
): boolean {
  if (filter === "all") {
    return true;
  }

  const todayYmd = bakeryCalendarDate(now, timeZone);
  const deadlineYmd = order.deadlineAt
    ? bakeryCalendarDate(order.deadlineAt, timeZone)
    : null;

  if (filter === "overdue") {
    if (
      order.status === "draft" ||
      SETTLED_STATUSES.has(order.status as StatusFilter)
    ) {
      return false;
    }
    return deadlineYmd != null && todayYmd != null && deadlineYmd < todayYmd;
  }

  if (!deadlineYmd || !todayYmd) {
    return false;
  }

  if (filter === "today") {
    return deadlineYmd === todayYmd;
  }
  if (filter === "tomorrow") {
    return deadlineYmd === addCalendarDays(todayYmd, 1);
  }

  const weekStart = startOfIsoWeek(todayYmd);
  const weekEnd = addCalendarDays(weekStart, 7);
  return deadlineYmd >= weekStart && deadlineYmd < weekEnd;
}

export function measurementParts(
  order: Pick<ListOrder, "weightKg" | "sizeNote" | "quantity">,
): MeasurementPart[] {
  const parts: MeasurementPart[] = [];

  if (order.weightKg != null && order.weightKg > 0) {
    parts.push({ kind: "weight", value: order.weightKg });
  }
  if (order.sizeNote?.trim()) {
    parts.push({ kind: "size", value: order.sizeNote.trim() });
  }
  if (order.quantity != null && order.quantity > 0) {
    parts.push({ kind: "quantity", value: order.quantity });
  }

  return parts;
}

export function sortByDeadline(orders: ListOrder[]): ListOrder[] {
  return [...orders].sort((left, right) => {
    const leftTime = deadlineTime(left.deadlineAt);
    const rightTime = deadlineTime(right.deadlineAt);
    if (leftTime !== rightTime) {
      return leftTime - rightTime;
    }
    return left.orderNumber - right.orderNumber;
  });
}

export function sortDrafts(orders: ListOrder[]): ListOrder[] {
  return [...orders].sort((left, right) => {
    const leftUpdated = Date.parse(left.updatedAt);
    const rightUpdated = Date.parse(right.updatedAt);
    if (leftUpdated !== rightUpdated) {
      return rightUpdated - leftUpdated;
    }
    return right.orderNumber - left.orderNumber;
  });
}

export function buildOrdersList(
  orders: ListOrder[],
  filters: { status: StatusFilter; date: DateFilter },
  now: Date,
  timeZone: string,
): OrdersListModel {
  const hasActiveFilters = filters.status !== "all" || filters.date !== "all";
  if (orders.length === 0) {
    return {
      totalCount: 0,
      hasActiveFilters,
      emptyKind: "bakery",
      groups: [],
      drafts: [],
    };
  }

  const production = orders.filter((order) => order.status !== "draft");
  const drafts = orders.filter((order) => order.status === "draft");

  const statusMatchedProduction =
    filters.status === "all" || filters.status === "draft"
      ? production
      : production.filter((order) => order.status === filters.status);

  const visibleProduction =
    filters.status === "draft"
      ? []
      : sortByDeadline(
          statusMatchedProduction.filter((order) =>
            matchesDateFilter(order, filters.date, now, timeZone),
          ),
        );

  const visibleDrafts =
    filters.status === "all" || filters.status === "draft"
      ? sortDrafts(drafts)
      : [];

  const groups = groupProductionOrders(visibleProduction, now, timeZone);
  const empty =
    visibleProduction.length === 0 && visibleDrafts.length === 0;

  return {
    totalCount: orders.length,
    hasActiveFilters,
    emptyKind: empty
      ? filters.status === "draft"
        ? "drafts"
        : "filtered"
      : "none",
    groups,
    drafts: visibleDrafts,
  };
}

export function ordersListQuery(input: {
  status: StatusFilter;
  date: DateFilter;
  notice?: OrdersListNotice | null;
  error?: OrdersListError | null;
}): string {
  const search = new URLSearchParams();
  if (input.status !== "all") {
    search.set("status", input.status);
  }
  if (input.date !== "all") {
    search.set("date", input.date);
  }
  if (input.notice) {
    search.set("notice", input.notice);
  }
  if (input.error) {
    search.set("error", input.error);
  }

  return search.toString();
}

function groupProductionOrders(
  orders: ListOrder[],
  now: Date,
  timeZone: string,
): ProductionGroup[] {
  const todayYmd = bakeryCalendarDate(now, timeZone);
  const grouped = new Map<string, ListOrder[]>();

  for (const order of orders) {
    const ymd = order.deadlineAt
      ? bakeryCalendarDate(order.deadlineAt, timeZone)
      : null;
    const key = ymd ?? "none";
    const bucket = grouped.get(key);
    if (bucket) {
      bucket.push(order);
    } else {
      grouped.set(key, [order]);
    }
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => {
      if (left === "none") {
        return 1;
      }
      if (right === "none") {
        return -1;
      }
      return left.localeCompare(right);
    })
    .map(([key, groupedOrders]) => {
      if (key === "none") {
        return {
          key,
          ymd: null,
          relative: "none" as const,
          orders: groupedOrders,
        };
      }

      return {
        key,
        ymd: key,
        relative: todayYmd ? dateGroupRelative(key, todayYmd) : "future",
        orders: groupedOrders,
      };
    });
}

function deadlineTime(deadlineAt: string | null): number {
  if (!deadlineAt) {
    return Number.POSITIVE_INFINITY;
  }
  const time = Date.parse(deadlineAt);
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
}
