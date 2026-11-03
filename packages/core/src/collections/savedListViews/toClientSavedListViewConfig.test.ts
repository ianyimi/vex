import { describe, expect, it } from "vitest";

import { toClientSavedListViewConfig } from "./toClientSavedListViewConfig";
import type { VexViewConfig } from "../types";

describe("toClientSavedListViewConfig", () => {
  it("strips where and reports hasHiddenFilter/hiddenFilterCount for a single-condition where", () => {
    const view: VexViewConfig = {
      viewId: "approved",
      name: "Approved",
      state: { where: { field: "status", op: "eq", value: "approved" } },
    };

    const result = toClientSavedListViewConfig(view);

    expect(result).not.toHaveProperty("state.where");
    expect(result.hasHiddenFilter).toBe(true);
    expect(result.hiddenFilterCount).toBe(1);
  });

  it("counts every leaf condition across nested and/or/not groups", () => {
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

    expect(toClientSavedListViewConfig(view).hiddenFilterCount).toBe(3);
  });

  it("omits description when the view has none", () => {
    const view: VexViewConfig = { viewId: "all", name: "All", state: {} };

    expect(toClientSavedListViewConfig(view).description).toBeUndefined();
  });
});
