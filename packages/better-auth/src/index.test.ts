import { describe, it, expect } from "vitest";
import { vexBetterAuth } from "./index";

describe("vexBetterAuth", () => {
  it("returns correct adapter shape", () => {
    const adapter = vexBetterAuth({ config: {} });
    expect(adapter.name).toBe("better-auth");
    expect(adapter.userCollection).toBe("user");
    // no extra keys on the adapter
    expect(Object.keys(adapter).sort()).toEqual([
      "name",
      "tables",
      "userCollection",
      "userFields",
    ]);
  });

  it("uses default slugs when no modelNames provided", () => {
    const adapter = vexBetterAuth({
      config: {},
    });
    expect(adapter.userCollection).toBe("user");
  });

  it("uses custom modelName for userCollection", () => {
    const adapter = vexBetterAuth({
      config: {
        user: { modelName: "users" },
      },
    });
    expect(adapter.userCollection).toBe("users");
  });

  // These tests are added in Step 8 after all internals are wired up:
  // - minimal config returns 12 user fields and 4 tables
  // - custom modelNames propagate into v.id() references
  // - admin plugin adds user fields and session impersonatedBy
  // - api-key plugin adds apikey table
  // - test app config produces expected adapter
  // - next-cookies plugin has no effect
});
