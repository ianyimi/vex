import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  defineAccess,
  defineCollection,
  defineConfig,
  number,
  text,
  type VexWhereNode,
} from "@vexcms/core";
import {
  LIST_VIEW_FILTER_OP_LABELS,
  LIST_VIEW_FILTER_STATUS_FIELD_KEY,
  listViewFilterOpsForFieldType,
} from "../listViewFilterOperators";
import { ListViewFilterBuilder } from "./index";
import { ListViewFilterChips } from "../ListViewFilterChips";
import { VexConfigProvider } from "../../../../config/VexConfigContext";
import { VexAuthProvider } from "../../../../auth/VexAuthContext";

const collection = defineCollection({
  slug: "filter_builder_posts",
  fields: { title: text({ label: "Title" }), views: number({ label: "Views" }) },
});

const versionedCollection = defineCollection({
  slug: "filter_builder_versioned_posts",
  fields: { title: text() },
  versions: { drafts: true },
});

// `defineCollection` auto-injects an `updatedAt` field unless opted out —
// `timestamps: false` here keeps these fixtures at EXACTLY the field count
// their names promise, for the search-threshold tests below.
const sixFieldCollection = defineCollection({
  slug: "filter_builder_six_fields",
  timestamps: false,
  fields: {
    f1: text({ label: "Field One" }),
    f2: text({ label: "Field Two" }),
    f3: text({ label: "Field Three" }),
    f4: text({ label: "Field Four" }),
    f5: text({ label: "Field Five" }),
    f6: text({ label: "Field Six" }),
  },
});

const sevenFieldCollection = defineCollection({
  slug: "filter_builder_seven_fields",
  timestamps: false,
  fields: {
    f1: text({ label: "Field One" }),
    f2: text({ label: "Field Two" }),
    f3: text({ label: "Field Three" }),
    f4: text({ label: "Field Four" }),
    f5: text({ label: "Field Five" }),
    f6: text({ label: "Field Six" }),
    f7: text({ label: "Field Seven" }),
  },
});

async function openFilterPopover(user: UserEvent) {
  await user.click(screen.getByRole("button", { name: /^Filter/ }));
  return screen.findByRole("dialog");
}

describe("listViewFilterOpsForFieldType", () => {
  it("offers number: eq, neq, gte, lte, isEmpty, isNotEmpty — never gt/lt", () => {
    expect(listViewFilterOpsForFieldType({ type: "number" })).toEqual([
      "eq", "neq", "gte", "lte", "isEmpty", "isNotEmpty",
    ]);
  });

  it("offers date: gte, lte, isEmpty, isNotEmpty only — no eq/neq", () => {
    expect(listViewFilterOpsForFieldType({ type: "date" })).toEqual([
      "gte", "lte", "isEmpty", "isNotEmpty",
    ]);
  });

  it("offers commitTs: gte, lte, isEmpty, isNotEmpty only — no eq/neq (same bucket as date)", () => {
    expect(listViewFilterOpsForFieldType({ type: "commitTs" })).toEqual([
      "gte", "lte", "isEmpty", "isNotEmpty",
    ]);
  });

  it("offers every other type: eq, neq, isEmpty, isNotEmpty", () => {
    expect(listViewFilterOpsForFieldType({ type: "text" })).toEqual(["eq", "neq", "isEmpty", "isNotEmpty"]);
    expect(listViewFilterOpsForFieldType({ type: "select" })).toEqual(["eq", "neq", "isEmpty", "isNotEmpty"]);
    expect(listViewFilterOpsForFieldType({ type: "checkbox" })).toEqual(["eq", "neq", "isEmpty", "isNotEmpty"]);
    expect(listViewFilterOpsForFieldType({ type: "relationship" })).toEqual(["eq", "neq", "isEmpty", "isNotEmpty"]);
  });

  it("offers vex_status (by field key, regardless of its select type): eq, neq only", () => {
    expect(listViewFilterOpsForFieldType({ type: "select", field: "vex_status" })).toEqual(["eq", "neq"]);
  });
});

describe("LIST_VIEW_FILTER_OP_LABELS", () => {
  it("pairs a symbol with the op code for every operator, including gt/lt", () => {
    expect(LIST_VIEW_FILTER_OP_LABELS).toEqual({
      eq: "= eq",
      neq: "≠ neq",
      gt: "> gt",
      gte: "≥ gte",
      lt: "< lt",
      lte: "≤ lte",
      isEmpty: "∅ empty",
      isNotEmpty: "!∅ empty",
    });
  });
});

describe("ListViewFilterBuilder", () => {
  it("opening the filter builder with no filter immediately shows one empty row — no 'Add filter' click needed, and it never changes the query until filled", async () => {
    const user = userEvent.setup();
    const onWhereChange = vi.fn();
    render(
      <ListViewFilterBuilder collection={collection}
      where={undefined}
      onWhereChange={onWhereChange}  />,
    );
    const dialog = await openFilterPopover(user);
    expect(within(dialog).getAllByRole("combobox").length).toBeGreaterThanOrEqual(2);
    expect(within(dialog).getByRole("button", { name: "AND condition" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "OR conditions" })).toBeInTheDocument();
    // Seeding calls `onWhereChange` with the no-op value the filter already
    // had (`undefined`) — never with a defined where, since the seeded row
    // itself stays incomplete until the user fills it in.
    expect(onWhereChange.mock.calls.every(([arg]) => arg === undefined)).toBe(true);
  });

  it("applies live once the row is complete (field/op/value), showing the operator's symbol+code as the selected value", async () => {
    const user = userEvent.setup();
    const onWhereChange = vi.fn();
    render(
      <ListViewFilterBuilder collection={collection}
      where={undefined}
      onWhereChange={onWhereChange}  />,
    );
    const dialog = await openFilterPopover(user);
    expect(within(dialog).getByRole("combobox", { name: /^Filter operator/ })).toHaveTextContent("= eq");
    const textbox = within(dialog).getByRole("textbox");
    await user.type(textbox, "hello");
    expect(onWhereChange).toHaveBeenLastCalledWith({ field: "title", op: "eq", value: "hello" });
  });

  it("isEmpty maps to eq/undefined and applies with no value input", async () => {
    const user = userEvent.setup();
    const onWhereChange = vi.fn();
    render(
      <ListViewFilterBuilder collection={collection}
      where={{ field: "title", op: "eq", value: "x" }}
      onWhereChange={onWhereChange}  />,
    );
    const dialog = await openFilterPopover(user);
    const [, opSelect] = within(dialog).getAllByRole("combobox");
    await user.click(opSelect!);
    await user.click(await screen.findByRole("option", { name: "∅ empty" }));
    expect(onWhereChange).toHaveBeenLastCalledWith({ field: "title", op: "eq", value: undefined });
    expect(within(dialog).queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("switching to a field whose matrix excludes eq (vex_status) defaults the op to eq anyway since eq IS vex_status's own first op", async () => {
    const user = userEvent.setup();
    const onWhereChange = vi.fn();
    render(
      <ListViewFilterBuilder collection={versionedCollection}
      where={undefined}
      onWhereChange={onWhereChange}  />,
    );
    const dialog = await openFilterPopover(user);
    const [fieldSelect] = within(dialog).getAllByRole("combobox");
    await user.click(fieldSelect!);
    await user.click(await screen.findByRole("option", { name: "Status" }));
    expect(within(dialog).getByRole("combobox", { name: /^Filter operator/ })).toHaveTextContent("= eq");
  });

  it("a legacy gt row (outside the new matrix) keeps its own operator selectable and visible, never dropped", async () => {
    const user = userEvent.setup();
    render(
      <ListViewFilterBuilder collection={collection}
      where={{ field: "views", op: "gt", value: 5 }}
      onWhereChange={vi.fn()}  />,
    );
    const dialog = await openFilterPopover(user);
    expect(within(dialog).getByRole("combobox", { name: /^Filter operator/ })).toHaveTextContent("> gt");
    const [, opSelect] = within(dialog).getAllByRole("combobox");
    await user.click(opSelect!);
    expect(await screen.findByRole("option", { name: "> gt" })).toBeInTheDocument();
    // The new matrix's own choices (no gt) are still offered alongside it.
    expect(await screen.findByRole("option", { name: "≥ gte" })).toBeInTheDocument();
  });

  it("renders a read-only panel for a where outside DNF form (e.g. `not`)", async () => {
    const user = userEvent.setup();
    const where = { not: { field: "title", op: "eq", value: "x" } } as never;
    render(
      <ListViewFilterBuilder collection={collection}
      where={where}
      onWhereChange={vi.fn()}  />,
    );
    const dialog = await openFilterPopover(user);
    expect(within(dialog).getByText(/can.t be edited here/i)).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "AND condition" })).not.toBeInTheDocument();
  });

  it("offers the synthetic vex_status field on a versioned collection", async () => {
    const user = userEvent.setup();
    render(
      <ListViewFilterBuilder collection={versionedCollection}
      where={undefined}
      onWhereChange={vi.fn()}  />,
    );
    const dialog = await openFilterPopover(user);
    const [fieldSelect] = within(dialog).getAllByRole("combobox");
    await user.click(fieldSelect!);
    expect(await screen.findByRole("option", { name: "Status" })).toBeInTheDocument();
  });

  it("excludes a field the caller can't read from the field picker", async () => {
    const access = defineAccess({
      roles: ["viewer"] as const,
      resources: [collection],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        viewer: { filter_builder_posts: { read: () => ({ title: true, views: false }) } },
      },
    });
    const user = userEvent.setup();
    render(
      <VexConfigProvider config={defineConfig({ access })}>
        <VexAuthProvider value={{ user: { _id: "u1", roles: "viewer" } }}>
          <ListViewFilterBuilder collection={collection}
          where={undefined}
          onWhereChange={vi.fn()}  />
        </VexAuthProvider>
      </VexConfigProvider>,
    );
    const dialog = await openFilterPopover(user);
    const [fieldSelect] = within(dialog).getAllByRole("combobox");
    await user.click(fieldSelect!);
    expect(await screen.findByRole("option", { name: "Title" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Views" })).not.toBeInTheDocument();
  });

  it("excludes the synthetic vex_status field from the picker when unreadable (access-system-fields.md decision 2b)", async () => {
    const access = defineAccess({
      roles: ["viewer"] as const,
      resources: [versionedCollection],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        viewer: {
          filter_builder_versioned_posts: {
            read: () => ({ title: true, [LIST_VIEW_FILTER_STATUS_FIELD_KEY]: false }) as never,
          },
        },
      },
    });
    const user = userEvent.setup();
    render(
      <VexConfigProvider config={defineConfig({ access })}>
        <VexAuthProvider value={{ user: { _id: "u1", roles: "viewer" } }}>
          <ListViewFilterBuilder collection={versionedCollection}
          where={undefined}
          onWhereChange={vi.fn()}  />
        </VexAuthProvider>
      </VexConfigProvider>,
    );
    const dialog = await openFilterPopover(user);
    const [fieldSelect] = within(dialog).getAllByRole("combobox");
    await user.click(fieldSelect!);
    expect(await screen.findByRole("option", { name: "title" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Status" })).not.toBeInTheDocument();
  });

  describe("switching operators (bug: isEmpty/isNotEmpty used to be a one-way trap)", () => {
    async function pickOp(user: UserEvent, dialog: HTMLElement, label: string): Promise<void> {
      const [, opSelect] = within(dialog).getAllByRole("combobox");
      await user.click(opSelect!);
      // `findByRole` (not `getByRole`): the option list mounts into a
      // floating-ui-positioned portal, one tick after the click settles —
      // asserting synchronously right after is what made this a flaky
      // regression test, not the component itself (every assertion against
      // the row's OWN DOM below stays synchronous, since that part updates
      // within the same `user.click`).
      await user.click(await screen.findByRole("option", { name: label }));
    }

    it("isEmpty -> eq keeps the row and applies eq, not isEmpty", async () => {
      const user = userEvent.setup();
      const onWhereChange = vi.fn();
      render(
        <ListViewFilterBuilder collection={collection}
        where={{ field: "views", op: "eq", value: undefined }}
        onWhereChange={onWhereChange}  />,
      );
      const dialog = await openFilterPopover(user);
      await pickOp(user, dialog, "= eq");
      expect(within(dialog).getByRole("combobox", { name: /^Filter operator/ })).toHaveTextContent("= eq");
      expect(within(dialog).getAllByRole("combobox")).toHaveLength(2);
      expect(onWhereChange).toHaveBeenLastCalledWith({ field: "views", op: "eq", value: 0 });
    });

    it("isEmpty -> neq keeps the row and applies neq, not isNotEmpty", async () => {
      const user = userEvent.setup();
      const onWhereChange = vi.fn();
      render(
        <ListViewFilterBuilder collection={collection}
        where={{ field: "views", op: "eq", value: undefined }}
        onWhereChange={onWhereChange}  />,
      );
      const dialog = await openFilterPopover(user);
      await pickOp(user, dialog, "≠ neq");
      expect(within(dialog).getByRole("combobox", { name: /^Filter operator/ })).toHaveTextContent("≠ neq");
      expect(within(dialog).getAllByRole("combobox")).toHaveLength(2);
      expect(onWhereChange).toHaveBeenLastCalledWith({ field: "views", op: "neq", value: 0 });
    });

    it("isEmpty -> gte keeps the row, offering a value input again", async () => {
      const user = userEvent.setup();
      const onWhereChange = vi.fn();
      render(
        <ListViewFilterBuilder collection={collection}
        where={{ field: "views", op: "eq", value: undefined }}
        onWhereChange={onWhereChange}  />,
      );
      const dialog = await openFilterPopover(user);
      await pickOp(user, dialog, "≥ gte");
      expect(within(dialog).getByRole("combobox", { name: /^Filter operator/ })).toHaveTextContent("≥ gte");
      expect(within(dialog).getAllByRole("combobox")).toHaveLength(2);
      expect(within(dialog).getByRole("spinbutton")).toBeInTheDocument();
      expect(onWhereChange).toHaveBeenLastCalledWith({ field: "views", op: "gte", value: 0 });
    });

    it("isNotEmpty -> lte keeps the row, offering a value input again", async () => {
      const user = userEvent.setup();
      const onWhereChange = vi.fn();
      render(
        <ListViewFilterBuilder collection={collection}
        where={{ field: "views", op: "neq", value: undefined }}
        onWhereChange={onWhereChange}  />,
      );
      const dialog = await openFilterPopover(user);
      await pickOp(user, dialog, "≤ lte");
      expect(within(dialog).getByRole("combobox", { name: /^Filter operator/ })).toHaveTextContent("≤ lte");
      expect(within(dialog).getAllByRole("combobox")).toHaveLength(2);
      expect(onWhereChange).toHaveBeenLastCalledWith({ field: "views", op: "lte", value: 0 });
    });

    it("eq -> isEmpty -> eq round-trips without ever removing the row", async () => {
      const user = userEvent.setup();
      const onWhereChange = vi.fn();
      render(
        <ListViewFilterBuilder collection={collection}
        where={{ field: "views", op: "eq", value: 5 }}
        onWhereChange={onWhereChange}  />,
      );
      const dialog = await openFilterPopover(user);
      await pickOp(user, dialog, "∅ empty");
      expect(within(dialog).getByRole("combobox", { name: /^Filter operator/ })).toHaveTextContent("∅ empty");
      expect(within(dialog).getAllByRole("combobox")).toHaveLength(2);
      expect(onWhereChange).toHaveBeenLastCalledWith({ field: "views", op: "eq", value: undefined });
      await pickOp(user, dialog, "= eq");
      expect(within(dialog).getByRole("combobox", { name: /^Filter operator/ })).toHaveTextContent("= eq");
      expect(within(dialog).getAllByRole("combobox")).toHaveLength(2);
      expect(onWhereChange).toHaveBeenLastCalledWith({ field: "views", op: "eq", value: 0 });
    });

    it("switching between two value-requiring ops (gte -> lte) keeps the entered value — only the value/no-value boundary resets it", async () => {
      const user = userEvent.setup();
      const onWhereChange = vi.fn();
      render(
        <ListViewFilterBuilder collection={collection}
        where={{ field: "views", op: "gte", value: 7 }}
        onWhereChange={onWhereChange}  />,
      );
      const dialog = await openFilterPopover(user);
      await pickOp(user, dialog, "≤ lte");
      expect(within(dialog).getByRole("combobox", { name: /^Filter operator/ })).toHaveTextContent("≤ lte");
      expect(onWhereChange).toHaveBeenLastCalledWith({ field: "views", op: "lte", value: 7 });
    });
  });

  describe("draft resilience (bug: completing one row/group used to silently drop another, still-incomplete one)", () => {
    it("completing group 1's row keeps a still-incomplete group 2 after a where round-trip (new object, same value)", async () => {
      const user = userEvent.setup();
      let lastWhere: VexWhereNode<string> | undefined | null;
      const onWhereChange = vi.fn((next: VexWhereNode<string> | undefined | null) => {
        lastWhere = next;
      });
      const { rerender } = render(
        <ListViewFilterBuilder collection={collection}
        where={undefined}
        onWhereChange={onWhereChange}  />,
      );
      const dialog = await openFilterPopover(user);
      // Complete the auto-seeded row (field defaults to Title, op eq).
      await user.type(within(dialog).getByRole("textbox"), "hello");
      // Simulate the real app's `urlState.setFilter` round-trip: the PARENT
      // re-renders with a NEW `where` object that's value-identical to what
      // was just applied — exactly what triggered the bug.
      rerender(
        <ListViewFilterBuilder collection={collection}
        where={{ ...lastWhere } as VexWhereNode<string>}
        onWhereChange={onWhereChange}  />,
      );
      // Add a second OR group — stays incomplete (no value yet).
      await user.click(within(dialog).getByRole("button", { name: "OR conditions" }));
      expect(within(dialog).getAllByRole("combobox", { name: /^Filter field/ })).toHaveLength(2);
      // Adding the group itself re-applies (group 2 contributes nothing,
      // so the VALUE is unchanged) — round-trip it again the same way.
      rerender(
        <ListViewFilterBuilder collection={collection}
        where={{ ...lastWhere } as VexWhereNode<string>}
        onWhereChange={onWhereChange}  />,
      );
      // Group 2's row must still be there — not silently dropped.
      expect(within(dialog).getAllByRole("combobox", { name: /^Filter field/ })).toHaveLength(2);
    });

    it("removing a chip for one row keeps a different, still-open incomplete row in the builder", async () => {
      const user = userEvent.setup();
      function Harness() {
        const [where, setWhere] = useState<VexWhereNode<string> | undefined>({
          field: "title",
          op: "eq",
          value: "x",
        });
        const handleWhereChange = (next: VexWhereNode<string> | undefined | null) => setWhere(next ?? undefined);
        return (
          <>
            <ListViewFilterBuilder collection={collection}
            where={where}
            onWhereChange={handleWhereChange}  />
            <ListViewFilterChips collection={collection} where={where} onWhereChange={handleWhereChange} visible={true} filterValueTitles={{}} />
          </>
        );
      }
      render(<Harness />);
      expect(screen.getByText("Title = eq x")).toBeInTheDocument();
      const dialog = await openFilterPopover(user);
      await user.click(within(dialog).getByRole("button", { name: "OR conditions" }));
      const fieldSelects = within(dialog).getAllByRole("combobox", { name: /^Filter field/ });
      expect(fieldSelects).toHaveLength(2);
      await user.click(fieldSelects[1]!);
      await user.click(await screen.findByRole("option", { name: "Views" }));
      // Remove the ORIGINAL chip (title = eq x) — a genuine external change
      // from OUTSIDE the builder, while group 2's row is still open/incomplete.
      await user.click(screen.getByRole("button", { name: /Remove Title = eq x filter/i }));
      expect(screen.queryByText("Title = eq x")).not.toBeInTheDocument();
      // Group 2's own edit (field switched to Views) must survive — not
      // reset to the auto-seeded default, and not dropped entirely.
      const remaining = within(dialog).getAllByRole("combobox", { name: /^Filter field/ });
      expect(remaining).toHaveLength(1);
      expect(remaining[0]).toHaveTextContent("Views");
    });

    it("a view switch (an unrelated where) fully replaces the draft", async () => {
      const user = userEvent.setup();
      const onWhereChange = vi.fn();
      const { rerender } = render(
        <ListViewFilterBuilder collection={collection}
        where={{ field: "title", op: "eq", value: "x" }}
        onWhereChange={onWhereChange}  />,
      );
      const dialog = await openFilterPopover(user);
      expect(within(dialog).getByRole("combobox", { name: /^Filter field/ })).toHaveTextContent("Title");
      rerender(
        <ListViewFilterBuilder collection={collection}
        where={{ field: "views", op: "gte", value: 10 }}
        onWhereChange={onWhereChange}  />,
      );
      expect(within(dialog).getByRole("combobox", { name: /^Filter field/ })).toHaveTextContent("Views");
      expect(within(dialog).getByRole("combobox", { name: /^Filter operator/ })).toHaveTextContent("≥ gte");
    });
  });

  describe("field picker search (developer-binding: search box at 7+ readable fields, auto-focused, filters by label and key)", () => {
    it("shows a plain Select with no search box at 6 readable fields", async () => {
      const user = userEvent.setup();
      render(
        <ListViewFilterBuilder collection={sixFieldCollection}
        where={undefined}
        onWhereChange={vi.fn()}  />,
      );
      const dialog = await openFilterPopover(user);
      expect(within(dialog).getByRole("combobox", { name: /^Filter field/ })).toBeInTheDocument();
      expect(within(dialog).queryByRole("button", { name: /^Filter field/ })).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText("Search fields…")).not.toBeInTheDocument();
    });

    it("shows a searchable combobox at 7 readable fields", async () => {
      const user = userEvent.setup();
      render(
        <ListViewFilterBuilder collection={sevenFieldCollection}
        where={undefined}
        onWhereChange={vi.fn()}  />,
      );
      const dialog = await openFilterPopover(user);
      expect(within(dialog).getByRole("button", { name: /^Filter field/ })).toBeInTheDocument();
      expect(within(dialog).queryByRole("combobox", { name: /^Filter field/ })).not.toBeInTheDocument();
    });

    it("auto-focuses the search input as soon as the field picker opens", async () => {
      const user = userEvent.setup();
      render(
        <ListViewFilterBuilder collection={sevenFieldCollection}
        where={undefined}
        onWhereChange={vi.fn()}  />,
      );
      const dialog = await openFilterPopover(user);
      await user.click(within(dialog).getByRole("button", { name: /^Filter field/ }));
      const searchInput = await screen.findByPlaceholderText("Search fields…");
      expect(searchInput).toHaveFocus();
    });

    it("filters the field list by label", async () => {
      const user = userEvent.setup();
      render(
        <ListViewFilterBuilder collection={sevenFieldCollection}
        where={undefined}
        onWhereChange={vi.fn()}  />,
      );
      const dialog = await openFilterPopover(user);
      await user.click(within(dialog).getByRole("button", { name: /^Filter field/ }));
      const searchInput = await screen.findByPlaceholderText("Search fields…");
      await user.type(searchInput, "Seven");
      expect(await screen.findByRole("option", { name: "Field Seven" })).toBeInTheDocument();
      expect(screen.queryByRole("option", { name: "Field One" })).not.toBeInTheDocument();
    });

    it("filters the field list by key", async () => {
      const user = userEvent.setup();
      render(
        <ListViewFilterBuilder collection={sevenFieldCollection}
        where={undefined}
        onWhereChange={vi.fn()}  />,
      );
      const dialog = await openFilterPopover(user);
      await user.click(within(dialog).getByRole("button", { name: /^Filter field/ }));
      const searchInput = await screen.findByPlaceholderText("Search fields…");
      await user.type(searchInput, "f3");
      expect(await screen.findByRole("option", { name: "Field Three" })).toBeInTheDocument();
      expect(screen.queryByRole("option", { name: "Field One" })).not.toBeInTheDocument();
    });

    it("selecting a field closes the picker and applies to the row", async () => {
      const user = userEvent.setup();
      const onWhereChange = vi.fn();
      render(
        <ListViewFilterBuilder collection={sevenFieldCollection}
        where={undefined}
        onWhereChange={onWhereChange}  />,
      );
      const dialog = await openFilterPopover(user);
      await user.click(within(dialog).getByRole("button", { name: /^Filter field/ }));
      const searchInput = await screen.findByPlaceholderText("Search fields…");
      await user.type(searchInput, "Seven");
      await user.click(await screen.findByRole("option", { name: "Field Seven" }));
      await waitFor(() => {
        expect(screen.queryByPlaceholderText("Search fields…")).not.toBeInTheDocument();
      });
      expect(within(dialog).getByRole("button", { name: /^Filter field/ })).toHaveTextContent("Field Seven");
    });
  });
});
