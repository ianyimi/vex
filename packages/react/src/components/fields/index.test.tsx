import { describe, it, expect } from "vitest";
import "../../adapter";
import { ADMIN_FIELDS, defineCollection, text, ui } from "@vexcms/core";
import { getCollectionColumnDefs } from "./index";
import { reactAdapter } from "../../adapter";

/**
 * Registry parity.
 *
 * `reactAdapter.fields` is the single source of truth `registry.ts` derives
 * `fieldToInputComponent`/`fieldToCellComponent` from. This assertion fails
 * loudly the moment a field type is registered in core without a React
 * component.
 */
describe("react field registries", () => {
  it("registers an Input and Cell component for every data-kind ADMIN_FIELDS type", () => {
    for (const { type } of Object.values(ADMIN_FIELDS).filter((f) => f.kind === "data")) {
      expect(reactAdapter.fields[type]?.input).toBeDefined();
      expect(reactAdapter.fields[type]?.cell).toBeDefined();
    }
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