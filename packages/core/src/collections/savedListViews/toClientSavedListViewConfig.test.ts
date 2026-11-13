import { describe, expect, it } from "vitest";

import { toClientSavedListViewConfig } from "./toClientSavedListViewConfig";
import type { VexViewConfig } from "../types";

const readableOnly = (readable: string[]) => (field: string) => readable.includes(field);
const allReadable = () => true;

describe("toClientSavedListViewConfig", () => {
  it("strips where and hides a single condition on a field the caller can't read", () => {
    const view: VexViewConfig = {
      viewId: "approved",
      name: "Approved",
      state: { where: { field: "status", op: "eq", value: "approved" } },
    };

    const result = toClientSavedListViewConfig(view, () => false);

    expect(result).not.toHaveProperty("state.where");
    expect(result.hasHiddenFilter).toBe(true);
    expect(result.hiddenFilterCount).toBe(1);
    expect(result.visibleWhere).toBeUndefined();
  });

  it("shows a single condition on a field the caller CAN read — no hidden filter at all", () => {
    const view: VexViewConfig = {
      viewId: "approved",
      name: "Approved",
      state: { where: { field: "status", op: "eq", value: "approved" } },
    };

    const result = toClientSavedListViewConfig(view, allReadable);

    expect(result.hasHiddenFilter).toBe(false);
    expect(result.hiddenFilterCount).toBe(0);
    expect(result.visibleWhere).toEqual({ field: "status", op: "eq", value: "approved" });
  });

  it("a mixed AND splits: the readable leaf stays visible, the unreadable one is counted hidden", () => {
    const view: VexViewConfig = {
      viewId: "mine",
      name: "Mine",
      state: {
        where: {
          and: [
            { field: "status", op: "eq", value: "active" },
            { field: "commission", op: "gt", value: 0 },
          ],
        },
      },
    };

    const result = toClientSavedListViewConfig(view, readableOnly(["status"]));

    expect(result.hasHiddenFilter).toBe(true);
    expect(result.hiddenFilterCount).toBe(1);
    expect(result.visibleWhere).toEqual({ field: "status", op: "eq", value: "active" });
  });

  it("counts every leaf condition across nested and/or/not groups when none is readable", () => {
    const view: VexViewConfig = {
      viewId: "complex",
      name: "Complex",
      state: {
        where: {
          and: [
            { field: "status", op: "eq", value: "approved" },
            {
              or: [
                { field: "featured", op: "eq", value: true },
                { not: { field: "archived", op: "eq", value: true } },
              ],
            },
          ],
        },
      },
    };

    const result = toClientSavedListViewConfig(view, () => false);
    expect(result.hiddenFilterCount).toBe(3);
    expect(result.visibleWhere).toBeUndefined();
  });

  it("an or/not branch is shown whole when every field it references is readable, hidden whole otherwise", () => {
    const view: VexViewConfig = {
      viewId: "orBranch",
      name: "Or branch",
      state: {
        where: {
          or: [
            { field: "featured", op: "eq", value: true },
            { field: "archived", op: "eq", value: true },
          ],
        },
      },
    };

    const fullyReadable = toClientSavedListViewConfig(view, allReadable);
    expect(fullyReadable.hasHiddenFilter).toBe(false);
    expect(fullyReadable.hiddenFilterCount).toBe(0);
    expect(fullyReadable.visibleWhere).toEqual(view.state.where);

    const partiallyReadable = toClientSavedListViewConfig(view, readableOnly(["featured"]));
    expect(partiallyReadable.hasHiddenFilter).toBe(true);
    expect(partiallyReadable.hiddenFilterCount).toBe(2);
    expect(partiallyReadable.visibleWhere).toBeUndefined();
  });

  it("omits description when the view has none", () => {
    const view: VexViewConfig = { viewId: "all", name: "All", state: {} };

    expect(toClientSavedListViewConfig(view, allReadable).description).toBeUndefined();
  });
});
