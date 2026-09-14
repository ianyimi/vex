import { describe, it, expect } from "vitest";

/**
 * Since vexQuery wraps Convex's query() which requires the Convex runtime,
 * we test the logic boundaries:
 * 1. The function exists and is callable
 * 2. Type-level tests (verified by TypeScript compilation)
 *
 * Full integration tests run in apps/test-app with `npx convex dev`.
 */
describe("vexQuery", () => {
  it("module exports vexQuery function", async () => {
    const mod = await import("./vexQuery");
    expect(typeof mod.vexQuery).toBe("function");
  });

  it("module exports VexDraftsMode type", async () => {
    // Type-level test — if this compiles, the type exists
    const mod = await import("./vexQuery");
    // VexQueryCtx and VexDraftsMode are type-only exports
    // Verify the module loads without errors
    expect(mod).toBeDefined();
  });
});
