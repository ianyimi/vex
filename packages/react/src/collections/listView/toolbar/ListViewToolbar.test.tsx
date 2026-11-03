import { describe, expect, it } from "vitest";
import { SLOT_IDS } from "@vexcms/core";
import { LIST_VIEW_TOOLBAR_SLOT_ID } from "./ListViewToolbar";

describe("ListViewToolbar", () => {
  it("targets the list.toolbar slot, per SLOT_IDS", () => {
    // Guards the slot `ListViewToolbar`'s `SlotOutlet` call must target — a
    // typo here would silently drop vex.list.search/vex.list.columns into
    // the wrong slot. `ListViewToolbar` itself renders through `SlotOutlet` and
    // `useListViewContext()`, which need a live `VexConfigProvider`/access
    // context/`ListViewContextProvider` — the same reason this test stays
    // at this level rather than mounting the full component.
    expect(LIST_VIEW_TOOLBAR_SLOT_ID).toBe(SLOT_IDS.list.toolbar);
    expect(LIST_VIEW_TOOLBAR_SLOT_ID).toBe("list.toolbar");
  });
});
