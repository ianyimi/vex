import { describe, expect, it } from "vitest";
import type { CollectionHooksInput } from "./hooks";

describe("CollectionHooksInput", () => {
  it("allows every hook to be omitted", () => {
    const hooks: CollectionHooksInput = {};
    expect(hooks.beforeChange).toBeUndefined();
    expect(hooks.afterChange).toBeUndefined();
  });

  it("accepts a full set of hooks with the documented signatures", () => {
    const hooks: CollectionHooksInput<"posts"> = {
      beforeChange: ({ doc }) => doc,
      beforeDelete: () => {},
      afterChange: () => {},
      afterDelete: () => {},
    };
    expect(typeof hooks.beforeChange).toBe("function");
  });
});
