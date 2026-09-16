import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  addCalendarDays,
  bakeryCalendarDate,
  buildOrdersList,
  dateGroupRelative,
  matchesDateFilter,
  measurementParts,
  ordersListQuery,
  parseDateFilter,
  parseStatusFilter,
  sortDrafts,
  startOfIsoWeek,
  type ListOrder,
} from "./list.ts";

const TZ = "Europe/Kyiv";

function order(overrides: Partial<ListOrder> & Pick<ListOrder, "id">): ListOrder {
  return {
    orderNumber: 1001,
    productType: "Cake",
    status: "accepted",
    deadlineAt: "2026-09-16T12:30:00.000Z",
    updatedAt: "2026-09-16T10:00:00.000Z",
    quantity: null,
    weightKg: 2.5,
    sizeNote: "Ø22 cm",
    assigneeName: null,
    ...overrides,
  };
}

describe("filter parsing", () => {
  it("accepts stored statuses and falls back for invalid values", () => {
    assert.equal(parseStatusFilter(undefined), "all");
    assert.equal(parseStatusFilter("draft"), "draft");
    assert.equal(parseStatusFilter("in_production"), "in_production");
    assert.equal(parseStatusFilter("nope"), "all");
  });

  it("accepts the MVP date filters and falls back for invalid values", () => {
    assert.equal(parseDateFilter(undefined), "all");
    assert.equal(parseDateFilter("today"), "today");
    assert.equal(parseDateFilter("week"), "week");
    assert.equal(parseDateFilter("sometime"), "all");
  });
});

describe("bakery calendar dates", () => {
  it("uses Europe/Kyiv midnight, not UTC, for the calendar day", () => {
    // 21:30 UTC on 15 Sep is already 00:30 on 16 Sep in Kyiv (EEST, UTC+3).
    assert.equal(
      bakeryCalendarDate("2026-09-15T21:30:00.000Z", TZ),
      "2026-09-16",
    );
    assert.equal(
      bakeryCalendarDate("2026-09-15T20:59:00.000Z", TZ),
      "2026-09-15",
    );
  });

  it("treats Monday as the start of the ISO week", () => {
    assert.equal(startOfIsoWeek("2026-09-16"), "2026-09-14");
    assert.equal(addCalendarDays(startOfIsoWeek("2026-09-16"), 7), "2026-09-21");
  });
});

describe("date filter matching", () => {
  const now = new Date("2026-09-16T10:00:00.000Z");

  it("matches today and tomorrow in bakery time", () => {
    const today = order({
      id: "today",
      deadlineAt: "2026-09-16T12:00:00.000Z",
    });
    const tomorrow = order({
      id: "tomorrow",
      deadlineAt: "2026-09-17T08:00:00.000Z",
    });

    assert.equal(matchesDateFilter(today, "today", now, TZ), true);
    assert.equal(matchesDateFilter(tomorrow, "today", now, TZ), false);
    assert.equal(matchesDateFilter(tomorrow, "tomorrow", now, TZ), true);
  });

  it("treats overdue as an active order whose deadline day is before today", () => {
    const overdue = order({
      id: "overdue",
      status: "in_production",
      deadlineAt: "2026-09-15T18:00:00.000Z",
    });
    const completed = order({
      id: "done",
      status: "completed",
      deadlineAt: "2026-09-15T18:00:00.000Z",
    });
    const draft = order({
      id: "draft",
      status: "draft",
      deadlineAt: "2026-09-15T18:00:00.000Z",
    });

    assert.equal(matchesDateFilter(overdue, "overdue", now, TZ), true);
    assert.equal(matchesDateFilter(completed, "overdue", now, TZ), false);
    assert.equal(matchesDateFilter(draft, "overdue", now, TZ), false);
  });

  it("includes this ISO week and excludes next week", () => {
    const sunday = order({
      id: "sunday",
      deadlineAt: "2026-09-20T10:00:00.000Z",
    });
    const nextMonday = order({
      id: "next",
      deadlineAt: "2026-09-21T10:00:00.000Z",
    });

    assert.equal(matchesDateFilter(sunday, "week", now, TZ), true);
    assert.equal(matchesDateFilter(nextMonday, "week", now, TZ), false);
  });
});

describe("measurement summary", () => {
  it("omits empty measurement values", () => {
    assert.deepEqual(
      measurementParts({
        weightKg: 2.5,
        sizeNote: "Ø22 cm",
        quantity: null,
      }),
      [
        { kind: "weight", value: 2.5 },
        { kind: "size", value: "Ø22 cm" },
      ],
    );
    assert.deepEqual(
      measurementParts({
        weightKg: null,
        sizeNote: "  ",
        quantity: 12,
      }),
      [{ kind: "quantity", value: 12 }],
    );
    assert.deepEqual(
      measurementParts({
        weightKg: null,
        sizeNote: null,
        quantity: null,
      }),
      [],
    );
  });
});

describe("orders list model", () => {
  const now = new Date("2026-09-16T10:00:00.000Z");

  it("groups production by deadline and keeps drafts separate", () => {
    const model = buildOrdersList(
      [
        order({
          id: "later",
          orderNumber: 1003,
          deadlineAt: "2026-09-18T09:00:00.000Z",
          status: "submitted",
        }),
        order({
          id: "today-late",
          orderNumber: 1002,
          deadlineAt: "2026-09-16T16:00:00.000Z",
          status: "accepted",
        }),
        order({
          id: "today-early",
          orderNumber: 1001,
          deadlineAt: "2026-09-16T08:00:00.000Z",
          status: "in_production",
        }),
        order({
          id: "draft-old",
          orderNumber: 1004,
          status: "draft",
          updatedAt: "2026-09-14T10:00:00.000Z",
        }),
        order({
          id: "draft-new",
          orderNumber: 1005,
          status: "draft",
          updatedAt: "2026-09-16T09:00:00.000Z",
        }),
      ],
      { status: "all", date: "all" },
      now,
      TZ,
    );

    assert.equal(model.emptyKind, "none");
    assert.deepEqual(
      model.groups.map((group) => group.key),
      ["2026-09-16", "2026-09-18"],
    );
    assert.equal(model.groups[0]?.relative, "today");
    assert.deepEqual(
      model.groups[0]?.orders.map((item) => item.id),
      ["today-early", "today-late"],
    );
    assert.deepEqual(
      model.drafts.map((item) => item.id),
      ["draft-new", "draft-old"],
    );
  });

  it("does not mix drafts into a today production filter", () => {
    const model = buildOrdersList(
      [
        order({
          id: "today",
          deadlineAt: "2026-09-16T12:00:00.000Z",
        }),
        order({
          id: "draft",
          status: "draft",
          deadlineAt: "2026-09-16T12:00:00.000Z",
        }),
      ],
      { status: "all", date: "today" },
      now,
      TZ,
    );

    assert.equal(model.groups[0]?.orders[0]?.id, "today");
    assert.equal(model.drafts[0]?.id, "draft");
  });

  it("uses a distinct empty state for a bakery with no orders", () => {
    const model = buildOrdersList(
      [],
      { status: "all", date: "all" },
      now,
      TZ,
    );
    assert.equal(model.emptyKind, "bakery");
  });

  it("uses a drafts empty state when the draft filter matches nothing", () => {
    const model = buildOrdersList(
      [order({ id: "live", status: "accepted" })],
      { status: "draft", date: "all" },
      now,
      TZ,
    );
    assert.equal(model.emptyKind, "drafts");
    assert.equal(model.hasActiveFilters, true);
  });

  it("uses a filtered empty state when dates match nothing", () => {
    const model = buildOrdersList(
      [order({ id: "later", deadlineAt: "2026-09-20T10:00:00.000Z" })],
      { status: "all", date: "today" },
      now,
      TZ,
    );
    assert.equal(model.emptyKind, "filtered");
  });

  it("handles a missing deadline without throwing", () => {
    const model = buildOrdersList(
      [order({ id: "undated", deadlineAt: null, status: "accepted" })],
      { status: "all", date: "all" },
      now,
      TZ,
    );
    assert.equal(model.groups[0]?.relative, "none");
    assert.equal(model.groups[0]?.orders[0]?.id, "undated");
  });
});

describe("draft sorting and hrefs", () => {
  it("sorts drafts by most recently updated first", () => {
    const sorted = sortDrafts([
      order({
        id: "older",
        updatedAt: "2026-09-01T00:00:00.000Z",
        orderNumber: 2,
      }),
      order({
        id: "newer",
        updatedAt: "2026-09-10T00:00:00.000Z",
        orderNumber: 1,
      }),
    ]);
    assert.deepEqual(
      sorted.map((item) => item.id),
      ["newer", "older"],
    );
  });

  it("omits default filters from the list query", () => {
    assert.equal(ordersListQuery({ status: "all", date: "all" }), "");
    assert.equal(
      ordersListQuery({
        status: "draft",
        date: "today",
        notice: "draftDeleted",
      }),
      "status=draft&date=today&notice=draftDeleted",
    );
  });
});

describe("relative group labels", () => {
  it("labels today, tomorrow, overdue and later dates", () => {
    assert.equal(dateGroupRelative("2026-09-16", "2026-09-16"), "today");
    assert.equal(dateGroupRelative("2026-09-17", "2026-09-16"), "tomorrow");
    assert.equal(dateGroupRelative("2026-09-15", "2026-09-16"), "overdue");
    assert.equal(dateGroupRelative("2026-09-20", "2026-09-16"), "future");
  });
});
