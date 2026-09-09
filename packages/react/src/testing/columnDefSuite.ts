import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import type { CellContext, ColumnDefResolved } from "@tanstack/react-table";
import { defineCollection, type AdminField, type CellComponentProps, type TDocument } from "@vexcms/core";

import { fieldToCellComponent, getCollectionColumnDefs } from "../components/fields";
import { makeCellRow } from "./fieldCellContract";
import type { FieldFixture } from "./fixtures/types";

/**
 * `ColumnDef.meta` is TanStack Table's declaration-merge extension point — an empty
 * interface by design until a consumer augments it. This package doesn't, so the
 * shape every `columnDef.tsx` actually assigns (`label`, `align`, `isTitleField`) is
 * read back through this local type rather than the library's own (empty) one.
 */
interface CellColumnMeta {
  label: string;
  align: string;
  isTitleField: boolean;
}

/** The single field key every collection this suite builds registers its field under. */
const FIELD_KEY = "field";

/** Options for {@link runColumnDefSuite}. */
export interface ColumnDefSuiteOptions<TField extends AdminField = AdminField, TValue = unknown> {
  /** The field type's fixture — supplies `fieldDef`, `fieldType`, and a representative `valid` value. */
  fixture: FieldFixture<TField, TValue>;
}

/**
 * Builds a one-field collection wrapping `fieldDef` under {@link FIELD_KEY} — the same
 * shape `getCollectionColumnDefs` consumes in production — with `admin.useAsTitle`
 * optionally pointed at that field.
 *
 * @param props - Collection-building props.
 * @param props.fieldType - The field type, kept in the slug only so parallel suites never collide.
 * @param props.fieldDef - The field definition to register.
 * @param props.asTitle - Whether `admin.useAsTitle` should point at the registered field.
 * @returns A `CollectionConfig` with exactly one field.
 */
function buildTestCollection(props: { fieldType: string; fieldDef: AdminField; asTitle: boolean }) {
  return defineCollection({
    slug: `columndef_${props.fieldType}`,
    fields: { [FIELD_KEY]: props.fieldDef },
    ...(props.asTitle ? { admin: { useAsTitle: FIELD_KEY } } : {}),
  });
}

/**
 * Runs the shared `xxxFieldToColumnDef` contract every field type owes, driven through
 * the real `getCollectionColumnDefs` dispatcher rather than importing each type's own
 * builder directly: `id`/`accessorKey` set to the field key, `header` from the field's
 * label (falling back to the field key), `meta.align` from `fieldDef.admin.cellAlignment`,
 * `meta.isTitleField` following `collection.admin.useAsTitle`, and the `cell` closure
 * rendering the field's registered Cell component (`fieldToCellComponent`) with the
 * row's resolved value and forwarded props.
 *
 * @param options - The field type's fixture.
 */
export function runColumnDefSuite<TField extends AdminField, TValue>(
  options: ColumnDefSuiteOptions<TField, TValue>,
): void {
  const { fixture } = options;

  describe(`${fixture.fieldType}FieldToColumnDef (via getCollectionColumnDefs)`, () => {
    it("sets id and accessorKey to the field key", () => {
      const collection = buildTestCollection({
        fieldType: fixture.fieldType,
        fieldDef: fixture.fieldDef,
        asTitle: false,
      });
      const [column] = getCollectionColumnDefs({ collection });
      const resolved = column as ColumnDefResolved<TDocument, TValue>;
      expect(resolved.id).toBe(FIELD_KEY);
      expect(resolved.accessorKey).toBe(FIELD_KEY);
    });

    it("uses the field's label as the header, falling back to the field key when unset", () => {
      const collection = buildTestCollection({
        fieldType: fixture.fieldType,
        fieldDef: fixture.fieldDef,
        asTitle: false,
      });
      const [labeled] = getCollectionColumnDefs({ collection });
      // Most fixtures set a real `label`; a fixture that legitimately doesn't (e.g.
      // `relationshipFieldFixture`) already exercises the fallback here — this
      // assertion holds either way instead of assuming every fixture has a label.
      expect((labeled as ColumnDefResolved<TDocument, TValue>).header).toBe(
        fixture.fieldDef.label || FIELD_KEY,
      );

      const unlabeledCollection = buildTestCollection({
        fieldType: fixture.fieldType,
        fieldDef: { ...fixture.fieldDef, label: "" },
        asTitle: false,
      });
      const [unlabeled] = getCollectionColumnDefs({ collection: unlabeledCollection });
      expect((unlabeled as ColumnDefResolved<TDocument, TValue>).header).toBe(FIELD_KEY);
    });

    it("reads meta.align from fieldDef.admin.cellAlignment and meta.isTitleField from collection.admin.useAsTitle", () => {
      const rightAligned = {
        ...fixture.fieldDef,
        admin: { ...fixture.fieldDef.admin, cellAlignment: "right" as const },
      };
      const collection = buildTestCollection({
        fieldType: fixture.fieldType,
        fieldDef: rightAligned,
        asTitle: true,
      });
      const [column] = getCollectionColumnDefs({ collection });
      const meta = column.meta as CellColumnMeta; // see CellColumnMeta above
      expect(meta.align).toBe("right");
      expect(meta.isTitleField).toBe(true);
    });

    it("renders the registered Cell component with the row's resolved value and forwarded props", () => {
      const collection = buildTestCollection({
        fieldType: fixture.fieldType,
        fieldDef: fixture.fieldDef,
        asTitle: true,
      });
      const [column] = getCollectionColumnDefs({ collection });
      const row = makeCellRow<TDocument>({ fieldKey: FIELD_KEY, value: fixture.valid });
      const context = { row } as unknown as CellContext<TDocument, TValue>;
      // `cell` is a closure over `xxxFieldToColumnDef`'s own props, never a registered
      // component reference — invoking it directly with a minimal `CellContext`
      // stand-in is the only way to assert both renderer identity and the exact props
      // it forwards without mounting a full table.
      const cellRenderer = column.cell as (
        ctx: CellContext<TDocument, TValue>,
      ) => ReactElement<CellComponentProps<TField, TDocument>>;
      const element = cellRenderer(context);
      expect(element.type).toBe(fieldToCellComponent(fixture.fieldType));
      expect(element.props).toMatchObject({
        value: fixture.valid,
        fieldKey: FIELD_KEY,
        isTitleField: true,
      });
    });
  });
}
