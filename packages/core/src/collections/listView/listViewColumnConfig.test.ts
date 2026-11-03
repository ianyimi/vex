import { describe, expect, it } from "vitest";
import { defineCollection, text, checkbox } from "../../index";
import { getDataFields } from "../../fields";
import { FIELD_TYPE_DEFAULT_WIDTH, resolveListViewColumnConfig } from "./listViewColumnConfig";

const collection = defineCollection({
  slug: "resolve_column_config_test",
  fields: {
    title: text({ required: false }),
    titleWithWidth: text({ required: false, admin: { columnWidth: 300 } }),
    featured: checkbox({
      required: false,
      index: "by_featured",
      admin: { enableSorting: true, enableHiding: false },
    }),
  },
});

const dataFields = getDataFields({ fields: collection.fields });

describe("resolveListViewColumnConfig", () => {
  it("falls all the way to the global type default width when neither the entry nor the field declares one", () => {
    const result = resolveListViewColumnConfig({
      fieldKey: "title",
      fieldDef: dataFields.title!,
      resolvedColumnEntry: undefined,
    });
    expect(result.width).toBe(FIELD_TYPE_DEFAULT_WIDTH.text);
  });

  it("a bare field-slug entry carries no overrides at all, equivalent to undefined", () => {
    const result = resolveListViewColumnConfig({
      fieldKey: "title",
      fieldDef: dataFields.title!,
      resolvedColumnEntry: "title",
    });
    expect(result.width).toBe(FIELD_TYPE_DEFAULT_WIDTH.text);
    expect(result.pinned).toBeUndefined();
    expect(result.hidden).toBe(false);
  });

  it("falls back to the field's own admin.columnWidth when the entry doesn't set one", () => {
    const result = resolveListViewColumnConfig({
      fieldKey: "titleWithWidth",
      fieldDef: dataFields.titleWithWidth!,
      resolvedColumnEntry: undefined,
    });
    expect(result.width).toBe(300);
  });

  it("the view's own entry.width wins over the field's own admin.columnWidth", () => {
    const result = resolveListViewColumnConfig({
      fieldKey: "titleWithWidth",
      fieldDef: dataFields.titleWithWidth!,
      resolvedColumnEntry: { field: "titleWithWidth", width: 500 },
    });
    expect(result.width).toBe(500);
  });

  it("resolves enableSorting/enableHiding from the field's own admin config when the entry doesn't override them", () => {
    const result = resolveListViewColumnConfig({
      fieldKey: "featured",
      fieldDef: dataFields.featured!,
      resolvedColumnEntry: undefined,
    });
    expect(result.enableSorting).toBe(true);
    expect(result.enableHiding).toBe(false);
  });

  it("VIEWS ALWAYS WIN: the entry's enableSorting/enableHiding override the field's own, in both directions (Decision 48)", () => {
    const overrideOff = resolveListViewColumnConfig({
      fieldKey: "featured",
      fieldDef: dataFields.featured!,
      resolvedColumnEntry: { field: "featured", enableSorting: false },
    });
    expect(overrideOff.enableSorting).toBe(false);

    const overrideOn = resolveListViewColumnConfig({
      fieldKey: "title",
      fieldDef: dataFields.title!,
      resolvedColumnEntry: { field: "title", enableHiding: true },
    });
    expect(overrideOn.enableHiding).toBe(true);
    // `title`'s own field-level default is `enableSorting: false` (unset in
    // the fixture) — unaffected by the unrelated `enableHiding` override.
    expect(overrideOn.enableSorting).toBe(false);
  });

  it("pinned has no field-level source — undefined unless the entry sets it", () => {
    expect(
      resolveListViewColumnConfig({ fieldKey: "title", fieldDef: dataFields.title!, resolvedColumnEntry: undefined })
        .pinned,
    ).toBeUndefined();
    expect(
      resolveListViewColumnConfig({
        fieldKey: "title",
        fieldDef: dataFields.title!,
        resolvedColumnEntry: { field: "title", pinned: "left" },
      }).pinned,
    ).toBe("left");
  });

  it("hidden has no field-level source — false unless the entry sets it", () => {
    expect(
      resolveListViewColumnConfig({ fieldKey: "title", fieldDef: dataFields.title!, resolvedColumnEntry: undefined })
        .hidden,
    ).toBe(false);
    expect(
      resolveListViewColumnConfig({
        fieldKey: "title",
        fieldDef: dataFields.title!,
        resolvedColumnEntry: { field: "title", hidden: true },
      }).hidden,
    ).toBe(true);
  });

  it("a checkbox field's global default width is narrow, matching FIELD_TYPE_DEFAULT_WIDTH.checkbox", () => {
    const result = resolveListViewColumnConfig({
      fieldKey: "featured",
      fieldDef: dataFields.featured!,
      resolvedColumnEntry: undefined,
    });
    expect(result.width).toBe(FIELD_TYPE_DEFAULT_WIDTH.checkbox);
    expect(result.width).toBeLessThan(FIELD_TYPE_DEFAULT_WIDTH.text);
  });
});
