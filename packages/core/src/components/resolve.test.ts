import { describe, expect, it } from "vitest";
import {
  resolveComponentContributions,
  resolveComponentOverrides,
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
