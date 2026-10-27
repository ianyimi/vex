import { describe, expect, it } from "vitest";
import {
  resolveComponentContributions,
  resolveComponentOverrides,
  resolveEditSlot,
  VexComponentConfigError,
} from "./resolve";

const comp = () => null;

describe("resolveComponentContributions", () => {
  it("returns contributions in array order when no order/before/after is set", () => {
    const result = resolveComponentContributions({
      slotId: "field.beforeInput",
      contributions: [
        { id: "a", component: comp },
        { id: "b", component: comp },
      ],
    });
    expect(result.map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("sorts by order, ties broken by array position", () => {
    const result = resolveComponentContributions({
      slotId: "field.beforeInput",
      contributions: [
        { id: "a", component: comp, order: 10 },
        { id: "b", component: comp, order: 0 },
        { id: "c", component: comp, order: 0 },
      ],
    });
    expect(result.map((r) => r.id)).toEqual(["b", "c", "a"]);
  });

  it("drops a real contribution whose id a hide directive names", () => {
    const result = resolveComponentContributions({
      slotId: "blocks.item.actions",
      contributions: [
        { id: "vex.block.duplicate", component: comp },
        { id: "vex.block.duplicate", hidden: true },
      ],
    });
    expect(result).toEqual([]);
  });

  it("ignores a hide directive matching nothing", () => {
    const result = resolveComponentContributions({
      slotId: "blocks.item.actions",
      contributions: [{ id: "vex.block.remove", hidden: true }],
    });
    expect(result).toEqual([]);
  });

  it("drops a contribution explicitly marked hidden: true with a component, without error", () => {
    const result = resolveComponentContributions({
      slotId: "field.beforeInput",
      contributions: [{ id: "a", component: comp, hidden: true }],
    });
    expect(result).toEqual([]);
  });

  it("throws VexComponentConfigError naming both positions on a genuine duplicate id", () => {
    expect(() =>
      resolveComponentContributions({
        slotId: "blocks.item.actions",
        contributions: [
          { id: "acme.action", component: comp },
          { id: "acme.action", component: comp },
        ],
      }),
    ).toThrow(VexComponentConfigError);
  });

  it("orders a contribution before another by id", () => {
    const result = resolveComponentContributions({
      slotId: "field.beforeInput",
      contributions: [
        { id: "a", component: comp },
        { id: "b", component: comp },
        { id: "c", component: comp, before: "a" },
      ],
    });
    expect(result.map((r) => r.id).indexOf("c")).toBeLessThan(
      result.map((r) => r.id).indexOf("a"),
    );
  });

  it("orders a contribution after another by id", () => {
    const result = resolveComponentContributions({
      slotId: "field.beforeInput",
      contributions: [
        { id: "a", component: comp, after: "b" },
        { id: "b", component: comp },
      ],
    });
    expect(result.map((r) => r.id)).toEqual(["b", "a"]);
  });

  it("ignores a before/after constraint naming an id that was hidden", () => {
    const result = resolveComponentContributions({
      slotId: "blocks.item.actions",
      contributions: [
        { id: "vex.block.duplicate", hidden: true },
        { id: "acme.action", component: comp, before: "vex.block.duplicate" },
      ],
    });
    expect(result.map((r) => r.id)).toEqual(["acme.action"]);
  });
});

describe("resolveEditSlot", () => {
  it("merges builtins, then root, then resource contributions in that array order when no order/before/after is set", () => {
    const result = resolveEditSlot({
      slotId: "edit.header.actions",
      builtins: [{ id: "vex.save", component: comp }],
      root: { contributions: [{ id: "acme.rootAction", component: comp }] },
      resource: { contributions: [{ id: "acme.resourceAction", component: comp }] },
    });
    expect(result.contributions.map((c) => c.id)).toEqual([
      "vex.save",
      "acme.rootAction",
      "acme.resourceAction",
    ]);
    expect(result.overrides).toEqual({});
  });

  it("sorts merged contributions by order across builtin, root and resource levels, ties broken by merge position", () => {
    const result = resolveEditSlot({
      slotId: "edit.header.actions",
      builtins: [{ id: "vex.save", component: comp, order: 10 }],
      root: { contributions: [{ id: "acme.rootAction", component: comp, order: 0 }] },
      resource: { contributions: [{ id: "acme.resourceAction", component: comp, order: 0 }] },
    });
    expect(result.contributions.map((c) => c.id)).toEqual([
      "acme.rootAction",
      "acme.resourceAction",
      "vex.save",
    ]);
  });

  it("a resource-level hide directive drops a built-in by id", () => {
    const result = resolveEditSlot({
      slotId: "edit.header.actions",
      builtins: [{ id: "vex.duplicate", component: comp }],
      root: {},
      resource: { contributions: [{ id: "vex.duplicate", hidden: true }] },
    });
    expect(result.contributions).toEqual([]);
  });

  it("merges root then resource override chains for the same built-in id, root entries first", () => {
    const result = resolveEditSlot({
      slotId: "edit.header.actions",
      builtins: [{ id: "vex.save", component: comp }],
      root: { overrides: { "vex.save": [{ id: "acme.rootWrap", component: comp }] } },
      resource: { overrides: { "vex.save": [{ id: "acme.resourceWrap", component: comp }] } },
    });
    expect(result.overrides["vex.save"]?.map((o) => o.id)).toEqual([
      "acme.rootWrap",
      "acme.resourceWrap",
    ]);
  });

  it("throws VexComponentConfigError when an override is keyed to an id that isn't in the slot's resolved contributions", () => {
    expect(() =>
      resolveEditSlot({
        slotId: "edit.header.actions",
        builtins: [{ id: "vex.save", component: comp }],
        root: { overrides: { "vex.save": [{ id: "acme.wrap", component: comp }] } },
        resource: { contributions: [{ id: "vex.save", hidden: true }] },
      }),
    ).toThrow(VexComponentConfigError);
  });

  it("throws VexComponentConfigError when a duplicate override id appears across root and resource chains for one built-in", () => {
    expect(() =>
      resolveEditSlot({
        slotId: "edit.header.actions",
        builtins: [{ id: "vex.save", component: comp }],
        root: { overrides: { "vex.save": [{ id: "acme.wrap", component: comp }] } },
        resource: { overrides: { "vex.save": [{ id: "acme.wrap", component: comp }] } },
      }),
    ).toThrow(VexComponentConfigError);
  });

  it("returns builtins-only contributions and no overrides when neither level configures the slot", () => {
    const result = resolveEditSlot({
      slotId: "edit.beforeFields",
      builtins: [],
    });
    expect(result).toEqual({ contributions: [], overrides: {} });
  });

  it("edit.actionsMenu: hides vex.duplicate and orders a root + resource item after it", () => {
    const result = resolveEditSlot({
      slotId: "edit.actionsMenu",
      builtins: [
        { id: "vex.revalidate", component: comp },
        { id: "vex.duplicate", component: comp },
      ],
      root: {
        contributions: [
          { id: "vex.duplicate", hidden: true },
          { id: "acme.rootItem", component: comp, after: "vex.duplicate" },
        ],
      },
      resource: {
        contributions: [{ id: "acme.resourceItem", component: comp, after: "vex.duplicate" }],
      },
    });
    expect(result.contributions.map((c) => c.id)).toEqual([
      "vex.revalidate",
      "acme.rootItem",
      "acme.resourceItem",
    ]);
  });

  it("edit.actionsMenu: wraps vex.revalidate via an override, receiving renderDefault", () => {
    const result = resolveEditSlot({
      slotId: "edit.actionsMenu",
      builtins: [{ id: "vex.revalidate", component: comp }],
      root: { overrides: { "vex.revalidate": [{ id: "acme.wrapRevalidate", component: comp }] } },
    });
    expect(result.overrides["vex.revalidate"]?.map((o) => o.id)).toEqual(["acme.wrapRevalidate"]);
  });
});

describe("resolveComponentOverrides", () => {
  it("returns overrides in array order", () => {
    const result = resolveComponentOverrides({
      slotId: "field.input",
      overrides: [
        { id: "a", component: comp },
        { id: "b", component: comp },
      ],
    });
    expect(result.map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("throws VexComponentConfigError naming both positions on a duplicate override id", () => {
    expect(() =>
      resolveComponentOverrides({
        slotId: "field.input",
        overrides: [
          { id: "acme.override", component: comp },
          { id: "acme.override", component: comp },
        ],
      }),
    ).toThrow(VexComponentConfigError);
  });
});
