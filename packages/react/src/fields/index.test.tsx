import { describe, it, expect } from "vitest";
import "../adapter";
import { ADMIN_FIELDS, defineCollection, text, ui } from "@vexcms/core";
import { getCollectionColumnDefs } from "./";
import { reactAdapter } from "../adapter";

/**
 * Registry parity.
 *
 * `reactAdapter.fields` is the single source of truth `registry.ts` derives
 * `fieldToFieldComponent`/`fieldToCellComponent` from. This assertion fails
 * loudly the moment a field type is registered in core without a React
 * component.
 */
describe("react field registries", () => {
  it("registers an Input and Cell component for every data-kind ADMIN_FIELDS type", () => {
    for (const { type } of Object.values(ADMIN_FIELDS).filter((f) => f.kind === "data")) {
      expect(reactAdapter.fields[type]?.field).toBeDefined();
      expect(reactAdapter.fields[type]?.cell).toBeDefined();
    }
  });

  // Decision 12 (polish, `2026-10-28-committs-field`): `commitTs` has no
  // FilterInput of its own — both fields compare a Unix-ms number via
  // `gte`/`lte`, so the registry maps `commitTs` straight onto the `date`
  // field's own `DateTimePicker` control (`commitTs/FilterInput.tsx` was
  // deleted, not duplicated).
  it("maps commitTs's filterInput onto date's — no commitTs-specific FilterInput component exists", () => {
    expect(reactAdapter.fields.commitTs?.filterInput).toBe(reactAdapter.fields.date?.filterInput);
    expect(reactAdapter.fields.commitTs?.filterInput).toBeDefined();
  });
});

describe("getCollectionColumnDefs", () => {
  it("excludes an admin.hidden field from the list view's columns", () => {
    const collection = defineCollection({
      slug: "hidden_column_test",
      timestamps: false,
      fields: {
        title: text({ label: "Title" }),
        secret: text({ label: "Secret", admin: { hidden: true } }),
      },
    });
    const columns = getCollectionColumnDefs({ collection });
    expect(columns.map((column) => column.id)).toEqual(["title"]);
  });
});

describe("getCollectionColumnDefs — views always win over field.admin (Decision 48)", () => {
  const collection = defineCollection({
    slug: "column_config_override_test",
    timestamps: false,
    fields: {
      title: text({ label: "Title", admin: { enableSorting: false, enableHiding: true } }),
      author: text({
        label: "Author",
        index: "by_author",
        admin: { enableSorting: true, enableHiding: false },
      }),
    },
  });

  it("falls back to field.admin.enableSorting/enableHiding when no columns prop is passed", () => {
    const columns = getCollectionColumnDefs({ collection });
    expect(columns.find((c) => c.id === "title")?.enableSorting).toBe(false);
    expect(columns.find((c) => c.id === "title")?.enableHiding).toBe(true);
    expect(columns.find((c) => c.id === "author")?.enableSorting).toBe(true);
    expect(columns.find((c) => c.id === "author")?.enableHiding).toBe(false);
  });

  it("a bare field-slug entry in columns carries no override, same as omitting the prop", () => {
    const columns = getCollectionColumnDefs({ collection, columns: ["title", "author"] });
    expect(columns.find((c) => c.id === "title")?.enableSorting).toBe(false);
    expect(columns.find((c) => c.id === "author")?.enableHiding).toBe(false);
  });

  it("an object-shaped entry's enableSorting/enableHiding override the field's own default, in both directions", () => {
    const columns = getCollectionColumnDefs({
      collection,
      columns: [
        { field: "title", enableSorting: true },
        { field: "author", enableHiding: true },
      ],
    });
    // title's own field default is enableSorting: false — the view's entry wins.
    expect(columns.find((c) => c.id === "title")?.enableSorting).toBe(true);
    // enableHiding untouched by that entry, still the field's own default.
    expect(columns.find((c) => c.id === "title")?.enableHiding).toBe(true);
    // author's own field default is enableHiding: false — the view's entry wins.
    expect(columns.find((c) => c.id === "author")?.enableHiding).toBe(true);
    expect(columns.find((c) => c.id === "author")?.enableSorting).toBe(true);
  });
});

describe("getCollectionColumnDefs — ui() Cell columns", () => {
  it("adds no column for a ui() field whose admin.components.Cell is unset", () => {
    const collection = defineCollection({
      slug: "ui_no_cell_test",
      timestamps: false,
      fields: {
        title: text({ label: "Title" }),
        helper: ui({ admin: { components: { Field: () => null } } }),
      },
    });
    const columns = getCollectionColumnDefs({ collection });
    expect(columns.map((column) => column.id)).toEqual(["title"]);
  });

  it("adds a column for a ui() field whose admin.components.Cell is set", () => {
    const collection = defineCollection({
      slug: "ui_cell_test",
      timestamps: false,
      fields: {
        title: text({ label: "Title" }),
        wordCount: ui({
          label: "Word Count",
          admin: { components: { Field: () => null, Cell: () => null } },
        }),
      },
    });
    const columns = getCollectionColumnDefs({ collection });
    expect(columns.map((column) => column.id)).toEqual(["title", "wordCount"]);
  });

  it("sets accessorKey on a ui() field's column so field-permission gating (CollectionListView's readability filter) can see it — previously undefined, which let an unreadable UI field's column through unfiltered (access-system-fields.md decision 2a)", () => {
    const collection = defineCollection({
      slug: "ui_cell_accessor_key_test",
      timestamps: false,
      fields: {
        title: text({ label: "Title" }),
        wordCount: ui({
          label: "Word Count",
          admin: { components: { Field: () => null, Cell: () => null } },
        }),
      },
    });
    const columns = getCollectionColumnDefs({ collection });
    const wordCountColumn = columns.find((column) => column.id === "wordCount");
    expect(wordCountColumn && "accessorKey" in wordCountColumn ? wordCountColumn.accessorKey : undefined).toBe(
      "wordCount",
    );
  });

  it("excludes an admin.hidden ui() field from the list view's columns", () => {
    const collection = defineCollection({
      slug: "ui_cell_hidden_test",
      timestamps: false,
      fields: {
        title: text({ label: "Title" }),
        wordCount: ui({
          admin: { hidden: true, components: { Field: () => null, Cell: () => null } },
        }),
      },
    });
    const columns = getCollectionColumnDefs({ collection });
    expect(columns.map((column) => column.id)).toEqual(["title"]);
  });
});