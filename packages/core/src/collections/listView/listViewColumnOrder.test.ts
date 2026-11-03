import { describe, expect, it } from "vitest";
import { defineCollection, text } from "../../index";
import { completeListViewColumnOrder, columnEntriesEqual } from "./listViewColumnOrder";

// `defineCollection` auto-injects an `updatedAt` field after every declared
// field (confirmed via `getDataFields` — see A's remainder digest entry),
// so every expectation below accounts for it landing last in declaration
// order.
const collection = defineCollection({
  slug: "complete_column_order_test",
  fields: {
    title: text({ required: false }),
    slug: text({ required: false }),
    body: text({ required: false }),
  },
});

describe("completeListViewColumnOrder", () => {
  it("appends every field as an explicitly-hidden entry when order is undefined", () => {
    expect(completeListViewColumnOrder({ order: undefined, collection })).toEqual([
      { field: "title", hidden: true },
      { field: "slug", hidden: true },
      { field: "body", hidden: true },
      { field: "updatedAt", hidden: true },
    ]);
  });

  it("appends fields missing from a back-compat subset, in declaration order, hidden", () => {
    expect(completeListViewColumnOrder({ order: ["body"], collection })).toEqual([
      "body",
      { field: "title", hidden: true },
      { field: "slug", hidden: true },
      { field: "updatedAt", hidden: true },
    ]);
  });

  it("returns an already-full explicit order unchanged, entries intact", () => {
    const order = [
      "slug",
      { field: "body", width: 240 },
      "updatedAt",
      { field: "title", pinned: "left" as const },
    ];
    expect(completeListViewColumnOrder({ order, collection })).toEqual(order);
  });

  it("drops a stale field no longer declared on the collection", () => {
    expect(
      completeListViewColumnOrder({ order: ["title", "removedField", "slug"] as never, collection }),
    ).toEqual(["title", "slug", { field: "body", hidden: true }, { field: "updatedAt", hidden: true }]);
  });

  it("deduplicates a repeated field entry, keeping its first position", () => {
    expect(completeListViewColumnOrder({ order: ["slug", "title", "slug"], collection })).toEqual([
      "slug",
      "title",
      { field: "body", hidden: true },
      { field: "updatedAt", hidden: true },
    ]);
  });

  it("returns just the auto-injected updatedAt field for a collection with no declared fields", () => {
    const empty = defineCollection({ slug: "complete_column_order_empty", fields: {} });
    expect(completeListViewColumnOrder({ order: undefined, collection: empty })).toEqual([
      { field: "updatedAt", hidden: true },
    ]);
  });

  const versionedCollection = defineCollection({
    slug: "complete_column_order_versioned_test",
    fields: { title: text({ required: false }) },
    versions: { drafts: true },
  });

  it("includes vex_status, FIRST and VISIBLE (not hidden), for a versioned collection when order is undefined", () => {
    expect(completeListViewColumnOrder({ order: undefined, collection: versionedCollection })).toEqual([
      { field: "vex_status" },
      { field: "title", hidden: true },
      { field: "updatedAt", hidden: true },
    ]);
  });

  it("includes vex_status, FIRST and VISIBLE, when an existing stored order never names it (the pre-this-feature shape every saved view has)", () => {
    expect(completeListViewColumnOrder({ order: ["title", "updatedAt"], collection: versionedCollection })).toEqual([
      { field: "vex_status" },
      "title",
      "updatedAt",
    ]);
  });

  it("keeps vex_status's own stored overrides (width/pinned/hidden) when the order already names it", () => {
    const order = [{ field: "vex_status", width: 180, pinned: "left" as const }, "title", "updatedAt"];
    expect(completeListViewColumnOrder({ order, collection: versionedCollection })).toEqual(order);
  });

  it("omits vex_status entirely for a non-versioned collection even when the stored order names it (a stale/foreign entry, dropped like any unknown field)", () => {
    expect(
      completeListViewColumnOrder({ order: ["title", "vex_status"] as never, collection }),
    ).toEqual(["title", { field: "slug", hidden: true }, { field: "body", hidden: true }, { field: "updatedAt", hidden: true }]);
  });
});

describe("columnEntriesEqual", () => {
  it("treats a bare slug and an equivalent explicit-default object entry as equal", () => {
    expect(columnEntriesEqual(["title"], [{ field: "title" }])).toBe(true);
    expect(columnEntriesEqual(["title"], [{ field: "title", hidden: false }])).toBe(true);
  });

  it("is order-sensitive", () => {
    expect(columnEntriesEqual(["title", "slug"], ["slug", "title"])).toBe(false);
  });

  it("detects a width/pinned/hidden difference on an otherwise-equal entry", () => {
    expect(columnEntriesEqual([{ field: "title", width: 200 }], [{ field: "title", width: 240 }])).toBe(
      false,
    );
    expect(
      columnEntriesEqual([{ field: "title", pinned: "left" }], [{ field: "title", pinned: "right" }]),
    ).toBe(false);
    expect(columnEntriesEqual([{ field: "title", hidden: true }], ["title"])).toBe(false);
  });

  it("ignores object key insertion order (never a false negative from JSON.stringify key order)", () => {
    const a = { field: "title", width: 200, pinned: "left" as const, hidden: false };
    const b = { hidden: false, pinned: "left" as const, width: 200, field: "title" };
    expect(columnEntriesEqual([a], [b])).toBe(true);
  });

  it("compares length before position, never throwing on a shorter array", () => {
    expect(columnEntriesEqual(["title"], ["title", "slug"])).toBe(false);
  });
});
