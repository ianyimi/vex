import { describe, expect, it } from "vitest";

import { resolveIconNodes } from "./resolveIconNodes";

describe("resolveIconNodes", () => {
  it("resolves known names to lucide keys with icon nodes and skips unknown ones", async () => {
    const nodes = await resolveIconNodes({ names: ["LayoutGrid", "Grid2x2", "NotAnIcon", "LayoutGrid"] });
    expect(Object.keys(nodes).sort()).toEqual(["grid-2-x-2", "layout-grid"]);
    expect(nodes["layout-grid"]![0]![0]).toBe("rect");
  });
});
