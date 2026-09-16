"use client";

import { useTranslations } from "next-intl";

import { Label } from "@/components/ui/label";
import { usePathname, useRouter } from "@/i18n/navigation";

import {
  DATE_FILTERS,
  ordersListQuery,
  type DateFilter,
  type StatusFilter,
} from "../list";
import { ORDER_STATUSES } from "../types";

const selectClassName =
  "type-value h-control w-full min-w-0 cursor-pointer border-0 border-b border-hairline bg-transparent transition-colors hover:border-b-ink focus-visible:border-b-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export function OrdersFilters({
  status,
  date,
}: {
  status: StatusFilter;
  date: DateFilter;
}) {
  const t = useTranslations("Orders");
  const router = useRouter();
  const pathname = usePathname();

  function replace(next: { status: StatusFilter; date: DateFilter }) {
    const query = ordersListQuery(next);
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="grid grid-cols-1 gap-layout sm:grid-cols-2">
      <div className="grid gap-cluster">
        <Label htmlFor="orders-status-filter">{t("filters.status")}</Label>
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
      <div className="grid gap-cluster">
        <Label htmlFor="orders-date-filter">{t("filters.date")}</Label>
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
  );
}
