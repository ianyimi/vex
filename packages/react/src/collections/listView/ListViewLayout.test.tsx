import { describe, expect, it } from "vitest";
import { BUILTIN_CONTRIBUTION_IDS, resolveComponentContributions, SLOT_IDS } from "@vexcms/core";
import { listRowActionsBuiltins, listBulkActionsBuiltins } from "./listViewBuiltinSlotContributions";

describe("listView built-in ids", () => {
  it("orders row-action built-ins Edit, Inspect, Copy ID, contributions, Delete last", () => {
    const resolved = resolveComponentContributions({
      slotId: SLOT_IDS.list.rowActions,
      contributions: [...listRowActionsBuiltins(), { id: "acme.flag", component: () => null }],
    });
    expect(resolved.map((c) => c.id)).toEqual([
      BUILTIN_CONTRIBUTION_IDS.list.rowOpen,
      BUILTIN_CONTRIBUTION_IDS.list.rowInspect,
      BUILTIN_CONTRIBUTION_IDS.list.rowCopyId,
      "acme.flag",
      BUILTIN_CONTRIBUTION_IDS.list.rowDelete,
    ]);
  });

  it("orders a project's own list.bulkActions contribution ahead of the built-in bulk delete", () => {
    const resolved = resolveComponentContributions({
      slotId: SLOT_IDS.list.bulkActions,
      contributions: [...listBulkActionsBuiltins(), { id: "acme.export", component: () => null }],
    });
    expect(resolved.map((c) => c.id)).toEqual(["acme.export", BUILTIN_CONTRIBUTION_IDS.list.bulkDelete]);
  });
});
