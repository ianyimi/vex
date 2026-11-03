import { describe, expect, it } from "vitest";
import type { VexWhereNode } from "@vexcms/core";
import { toListViewFilterGroups, fromListViewFilterGroups, listFilterOpOf, applyListFilterOp, type ListViewFilterGroup, type ListViewFilterLeaf } from "./listViewFilterGroups";

const published: VexWhereNode<string> = { field: "status", op: "eq", value: "published" };
const draft: VexWhereNode<string> = { field: "status", op: "eq", value: "draft" };
const viewsOver100: VexWhereNode<string> = { field: "views", op: "gt", value: 100 };
const notArchived: VexWhereNode<string> = { field: "archived", op: "neq", value: true };
const emptyCompany: ListViewFilterLeaf<string> = { field: "company", op: "eq", value: undefined };
const nonEmptyCompany: ListViewFilterLeaf<string> = { field: "company", op: "neq", value: undefined };

describe("toListViewFilterGroups", () => {
  it("returns an empty group list for undefined", () => {
    expect(toListViewFilterGroups({ where: undefined })).toEqual({ groups: [] });
  });

  it("wraps a bare leaf in one group of one row", () => {
    expect(toListViewFilterGroups({ where: published })).toEqual({ groups: [{ rows: [published] }] });
  });

  it("flattens a flat `and` of leaves into one group", () => {
    const where: VexWhereNode<string> = { and: [published, viewsOver100] };
    expect(toListViewFilterGroups({ where })).toEqual({ groups: [{ rows: [published, viewsOver100] }] });
  });

  it("flattens a single-leaf `and` into one group of one row", () => {
    const where: VexWhereNode<string> = { and: [published] };
    expect(toListViewFilterGroups({ where })).toEqual({ groups: [{ rows: [published] }] });
  });

  it("flattens an `or` of leaves into one group per leaf", () => {
    const where: VexWhereNode<string> = { or: [published, draft] };
    expect(toListViewFilterGroups({ where })).toEqual({
      groups: [{ rows: [published] }, { rows: [draft] }],
    });
  });

  it("flattens an `or` of flat `and`s into one group per `and`", () => {
    const where: VexWhereNode<string> = {
      or: [{ and: [published, viewsOver100] }, { and: [draft, notArchived] }],
    };
    expect(toListViewFilterGroups({ where })).toEqual({
      groups: [
        { rows: [published, viewsOver100] },
        { rows: [draft, notArchived] },
      ],
    });
  });

  it("accepts an `or` mixing bare leaves and flat `and`s", () => {
    const where: VexWhereNode<string> = { or: [published, { and: [draft, notArchived] }] };
    expect(toListViewFilterGroups({ where })).toEqual({
      groups: [{ rows: [published] }, { rows: [draft, notArchived] }],
    });
  });

  it("accepts an `or` member that is a single-leaf `and`", () => {
    const where: VexWhereNode<string> = { or: [published, { and: [draft] }] };
    expect(toListViewFilterGroups({ where })).toEqual({
      groups: [{ rows: [published] }, { rows: [draft] }],
    });
  });

  it("returns null for a `not` node", () => {
    expect(toListViewFilterGroups({ where: { not: published } })).toBeNull();
  });

  it("returns null for an `and` containing a nested `or`", () => {
    const where: VexWhereNode<string> = { and: [published, { or: [draft, viewsOver100] }] };
    expect(toListViewFilterGroups({ where })).toBeNull();
  });

  it("returns null for an `and` containing a `not`", () => {
    const where: VexWhereNode<string> = { and: [published, { not: draft }] };
    expect(toListViewFilterGroups({ where })).toBeNull();
  });

  it("returns null for an `or` containing a nested `or`", () => {
    const where: VexWhereNode<string> = { or: [published, { or: [draft, viewsOver100] }] };
    expect(toListViewFilterGroups({ where })).toBeNull();
  });

  it("returns null for an `or` containing a `not`", () => {
    const where: VexWhereNode<string> = { or: [published, { not: draft }] };
    expect(toListViewFilterGroups({ where })).toBeNull();
  });

  it("returns null for an `or` member that is an `and` with a nested non-leaf", () => {
    const where: VexWhereNode<string> = {
      or: [published, { and: [draft, { not: viewsOver100 }] }],
    };
    expect(toListViewFilterGroups({ where })).toBeNull();
  });

  it("returns null for an empty `and`", () => {
    expect(toListViewFilterGroups({ where: { and: [] } })).toBeNull();
  });

  it("returns null for an empty `or`", () => {
    expect(toListViewFilterGroups({ where: { or: [] } })).toBeNull();
  });
});

describe("fromListViewFilterGroups", () => {
  it("returns undefined for no groups", () => {
    expect(fromListViewFilterGroups({ groups: [] })).toBeUndefined();
  });

  it("drops empty groups and returns undefined if none remain", () => {
    const groups: ListViewFilterGroup<string>[] = [{ rows: [] }, { rows: [] }];
    expect(fromListViewFilterGroups({ groups })).toBeUndefined();
  });

  it("returns the bare leaf for one group of one row", () => {
    const groups: ListViewFilterGroup<string>[] = [{ rows: [published] }];
    expect(fromListViewFilterGroups({ groups })).toEqual(published);
  });

  it("returns an `and` for one group with 2+ rows", () => {
    const groups: ListViewFilterGroup<string>[] = [{ rows: [published, viewsOver100] }];
    expect(fromListViewFilterGroups({ groups })).toEqual({ and: [published, viewsOver100] });
  });

  it("returns an `or` of leaves/`and`s for 2+ surviving groups", () => {
    const groups: ListViewFilterGroup<string>[] = [
      { rows: [published] },
      { rows: [draft, notArchived] },
    ];
    expect(fromListViewFilterGroups({ groups })).toEqual({
      or: [published, { and: [draft, notArchived] }],
    });
  });

  it("round-trips toListViewFilterGroups output back to the original where", () => {
    const where: VexWhereNode<string> = {
      or: [{ and: [published, viewsOver100] }, { and: [draft, notArchived] }],
    };
    const dnf = toListViewFilterGroups({ where });
    expect(dnf).not.toBeNull();
    expect(fromListViewFilterGroups({ groups: dnf!.groups })).toEqual(where);
  });
});

describe("listFilterOpOf / applyListFilterOp", () => {
  it("reads an eq/undefined leaf as isEmpty", () => {
    expect(listFilterOpOf({ leaf: emptyCompany })).toBe("isEmpty");
  });

  it("reads a neq/undefined leaf as isNotEmpty", () => {
    expect(listFilterOpOf({ leaf: nonEmptyCompany })).toBe("isNotEmpty");
  });

  it("reads any other leaf's op unchanged", () => {
    expect(listFilterOpOf({ leaf: published as ListViewFilterLeaf<string> })).toBe("eq");
  });

  it("applies isEmpty as eq/undefined", () => {
    expect(
      applyListFilterOp({ leaf: { field: "company", op: "eq", value: "x" }, op: "isEmpty" }),
    ).toEqual({ field: "company", op: "eq", value: undefined });
  });

  it("applies isNotEmpty as neq/undefined", () => {
    expect(
      applyListFilterOp({ leaf: { field: "company", op: "eq", value: "x" }, op: "isNotEmpty" }),
    ).toEqual({ field: "company", op: "neq", value: undefined });
  });

  it("applies any other op as-is", () => {
    expect(
      applyListFilterOp({ leaf: { field: "views", op: "eq", value: 1 }, op: "gt" }),
    ).toEqual({ field: "views", op: "gt", value: 1 });
  });
});
