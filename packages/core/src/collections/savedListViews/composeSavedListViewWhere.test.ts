import { describe, expect, it } from "vitest";

import { composeSavedListViewWhere } from "./composeSavedListViewWhere";

describe("composeSavedListViewWhere", () => {
  it("returns undefined when neither viewWhere nor filter is set", () => {
    expect(composeSavedListViewWhere({})).toBeUndefined();
  });

  it("returns viewWhere alone when filter is omitted", () => {
    const viewWhere = { field: "status", op: "eq", value: "approved" } as const;

    expect(composeSavedListViewWhere({ viewWhere })).toEqual(viewWhere);
  });

  it("returns filter alone when viewWhere is omitted", () => {
    const filter = { field: "source", op: "eq", value: "g2" } as const;

    expect(composeSavedListViewWhere({ filter })).toEqual(filter);
  });

  it("ANDs viewWhere and filter together when both are set", () => {
    const viewWhere = { field: "status", op: "eq", value: "approved" } as const;
    const filter = { field: "source", op: "eq", value: "g2" } as const;

    expect(composeSavedListViewWhere({ viewWhere, filter })).toEqual({ and: [viewWhere, filter] });
  });

  it("preserves a nested and/or/not filter unchanged when no viewWhere is active", () => {
    const filter = {
      or: [
        { field: "source", op: "eq", value: "g2" },
        { not: { field: "archived", op: "eq", value: true } },
      ],
    } as const;

    expect(composeSavedListViewWhere({ filter })).toEqual(filter);
  });
});
