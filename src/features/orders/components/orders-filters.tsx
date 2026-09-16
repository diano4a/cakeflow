"use client";

import { useTranslations } from "next-intl";

import { usePathname, useRouter } from "@/i18n/navigation";

import {
  DATE_FILTERS,
  ordersListQuery,
  type DateFilter,
  type StatusFilter,
} from "../list";
import { ORDER_STATUSES } from "../types";

const selectClassName =
  "type-data h-control-sm min-w-0 cursor-pointer border-0 border-b border-hairline bg-transparent py-0 transition-colors hover:border-b-ink focus-visible:border-b-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:w-auto";

export function OrdersFilters({
  status,
  date,
  countLabel,
}: {
  status: StatusFilter;
  date: DateFilter;
  countLabel: string;
}) {
  const t = useTranslations("Orders");
  const router = useRouter();
  const pathname = usePathname();

  function replace(next: { status: StatusFilter; date: DateFilter }) {
    const query = ordersListQuery(next);
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="flex flex-col gap-cluster sm:flex-row sm:items-baseline sm:justify-between">
      <div className="grid grid-cols-2 items-end gap-x-layout gap-y-cluster sm:flex sm:flex-wrap sm:items-baseline">
        <div className="flex min-w-0 flex-col gap-cluster sm:flex-row sm:items-baseline">
          <label htmlFor="orders-status-filter" className="type-label">
            {t("filters.status")}
          </label>
          <select
            id="orders-status-filter"
            name="status"
            value={status}
            className={selectClassName}
            onChange={(event) =>
              replace({
                status: event.target.value as StatusFilter,
                date,
              })
            }
          >
            <option value="all">{t("filters.allStatuses")}</option>
            {ORDER_STATUSES.map((value) => (
              <option key={value} value={value}>
                {t(`statuses.${value}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex min-w-0 flex-col gap-cluster sm:flex-row sm:items-baseline">
          <label htmlFor="orders-date-filter" className="type-label">
            {t("filters.date")}
          </label>
          <select
            id="orders-date-filter"
            name="date"
            value={date}
            className={selectClassName}
            onChange={(event) =>
              replace({
                status,
                date: event.target.value as DateFilter,
              })
            }
          >
            {DATE_FILTERS.map((value) => (
              <option key={value} value={value}>
                {t(`filters.${value === "all" ? "allDates" : value}`)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="type-label">{countLabel}</p>
    </div>
  );
}
