import { createElement, type ComponentType } from "react";
import { cleanup, render, type RenderResult } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Row } from "@tanstack/react-table";
import { afterEach, describe, expect, it } from "vitest";
import type { AdminField, CellComponentProps, CollectionConfig, TDocument } from "@vexcms/core";

import { expectNoA11yViolations } from "./a11y";
import { testCollection } from "./harness/accessFixtures";
import type { FieldFixture } from "./fixtures/types";

/** Options for {@link runFieldCellContractSuite}. */
export interface FieldCellContractOptions<
  TField extends AdminField = AdminField,
  TValue = unknown,
> {
  /** The field type's fixture — supplies `fieldDef` and a representative `valid` value. */
  fixture: FieldFixture<TField, TValue>;
  /** The field's registered Cell component, e.g. `TextFieldCell`. */
  Component: ComponentType<CellComponentProps<TField, TDocument>>;
  /** Parent collection config forwarded to every render. Defaults to `testCollection` ("posts"). */
  collection?: CollectionConfig;
  /**
   * Truncation threshold. Defaults to 77 — `text/Cell.tsx`'s own cutoff — and the
   * assertion runs by DEFAULT. Pass `false` ONLY for the four types where truncation
   * is meaningless: `date` (fixed format), `number`, `checkbox` (boolean), and `color`
   * (`#e8622a`).
   */
  truncates?: number | false;
  /** Type-specific rendering assertions, appended inside the same `describe` block. */
  extra?: (options: FieldCellContractOptions<TField, TValue>) => void;
}

/** The `fieldKey` every base-contract render registers its value under. */
const FIELD_KEY = "field";

/** The document `_id` used when rendering with `isTitleField: true`. */
const TITLE_ROW_ID = "doc_title_1";

/** Default truncation threshold — `text/Cell.tsx`'s own cutoff (its JSDoc says "80"; the code says 77 — a doc/code divergence noted in this step's own notes, not corrected here). */
const DEFAULT_TRUNCATE_THRESHOLD = 77;

/**
 * Minimal test double for TanStack Table's `Row`. Every Cell this factory exercises
 * reads only two members: `.original` (`RelationshipFieldCell` keys off it directly,
 * bypassing `props.value` entirely) and `.getValue` (every `columnDef`'s own `cell`
 * closure calls it) — every other `Row` method is unused at this boundary, so this is
 * not a fake instance of the library type, only a stand-in for the slice actually read.
 *
 * @param props - Row construction props.
 * @param props.fieldKey - Key the value is stored under on `row.original`.
 * @param props.value - The value to store at `original[fieldKey]`.
 * @param props.id - `_id` for the row's `original`. Defaults to a fixed stub id.
 * @returns A `Row` stand-in carrying `.original` and `.getValue`.
 */
export function makeCellRow<TData extends TDocument>(props: {
  fieldKey: string;
  value: unknown;
  id?: string;
}): Row<TData> {
  const original = { _id: props.id ?? "doc_1", [props.fieldKey]: props.value } as unknown as TData;
  // Test-only stand-in for a `@tanstack/react-table` `Row` — see the JSDoc above for
  // why only `.original`/`.getValue` are populated.
  return {
    original,
    getValue: (key: string) => (original as Record<string, unknown>)[key],
  } as unknown as Row<TData>;
}

/**
 * Derives a value that exceeds `threshold` from a fixture's `valid` value, generically
 * across value shapes: a string is repeated until long enough to slice; an array is
 * duplicated until its serialized length exceeds the threshold (so a renderer that
 * concatenates item text — chips, badges, counts — has enough material to overflow
 * regardless of per-item formatting); a plain object gains synthetic keys the same way.
 * Anything else is returned unchanged — no currently-registered field type reaches
 * that branch.
 *
 * @param valid - A representative valid value, from the field's own fixture.
 * @param threshold - The truncation threshold under test.
 * @returns A same-shaped value whose serialized form exceeds `threshold`.
 */
function buildOverLengthValue(valid: unknown, threshold: number): unknown {
  const target = threshold + 25;
  if (typeof valid === "string") {
    const unit = valid.length > 0 ? valid : "x";
    return unit.repeat(Math.ceil(target / unit.length));
  }
  if (Array.isArray(valid)) {
    const out: unknown[] = [];
    while (JSON.stringify(out).length <= target && out.length < 500) {
      out.push(...valid);
    }
    return out.length > 0 ? out : valid;
  }
  if (valid !== null && typeof valid === "object") {
    const out: Record<string, unknown> = { ...(valid as Record<string, unknown>) };
    let i = 0;
    while (JSON.stringify(out).length <= target && i < 200) {
      out[`extra_${i}`] = "x".repeat(20);
      i += 1;
    }
    return out;
  }
  return valid;
}

/**
 * Runs the shared Cell contract every field type's data-table cell owes, regardless of
 * type. Mirrors `runFieldInputContractSuite`'s shape: base assertions here, everything
 * type-specific in `extra`.
 *
 * Base assertions:
 * 1. Renders the em-dash placeholder for a `null`/`undefined` value. Reference:
 *    `checkbox/Cell.tsx` — `if (props.value === undefined || props.value === null)
 *    return <span>—</span>;` — the simplest of the five Cells that actually implement
 *    this (checkbox, group, blocks, upload, relationship). The other seven either
 *    crash with no guard at all (`text`, `array` — real, critical-severity defects: an
 *    uncaught render error takes out the whole table, not one cell) or silently render
 *    nothing / an empty node instead of "—" (`url`, `color`, `date`, `number`,
 *    `select`) — this assertion is written to surface those, not written assuming they
 *    pass.
 * 2. When `isTitleField` is `true`, wraps the rendered value in a link to
 *    `${addLeadingSlash(config.basePath)}/${collection.slug}/${row.original._id}`.
 *    Reference: `text/Cell.tsx:27-34`. `useVexConfig()` falls back to
 *    `defineConfig()`'s default `basePath: "/admin"` with no provider mounted, so the
 *    expected href is computed the same way here, with no `VexConfigContext.Provider`
 *    needed.
 * 3. Unless `truncates: false`, a value past the threshold is cut and the full value
 *    appears on a `title` attribute. Reference: `text/Cell.tsx`'s own
 *    `value.length > 77 ? slice(0, 77) + "..." : value` plus `title={props.value}`.
 * 4. Zero accessibility violations on the type's own `valid` value.
 *
 * @param options - The field's fixture, component, and contract options.
 */
export function runFieldCellContractSuite<TField extends AdminField, TValue>(
  options: FieldCellContractOptions<TField, TValue>,
): void {
  const { fixture, Component, extra } = options;
  const collection = options.collection ?? testCollection;
  const truncates = options.truncates ?? DEFAULT_TRUNCATE_THRESHOLD;

  function renderCell(props: { value: unknown; isTitleField?: boolean; id?: string }): RenderResult {
    // A `QueryClient` whose default `queryFn` never resolves — the same pattern
    // `upload/Input.test.tsx` uses for `UploadFieldCell`'s real `useQuery(get(...))`
    // call: a deterministic pending state, no real network call, no "No queryFn was
    // passed" console noise. Harmless for the other 11 types, which never call
    // `useQuery`.
    const queryClient = new QueryClient({
      defaultOptions: { queries: { queryFn: () => new Promise<never>(() => {}) } },
    });
    const row = makeCellRow<TDocument>({ fieldKey: FIELD_KEY, value: props.value, id: props.id });
    const cellProps: CellComponentProps<TField, TDocument> = {
      // Boundary cast: this factory intentionally stays generic over `unknown` so
      // every type shares one render path, including deliberately invalid inputs
      // (null, undefined, over-length values) the real `TField["defaultValue"]` would
      // reject — that's the whole point of the base contract's assertions.
      value: props.value as TField["defaultValue"],
      row,
      fieldDef: fixture.fieldDef,
      fieldKey: FIELD_KEY,
      isTitleField: props.isTitleField ?? false,
      collection,
    };
    return render(
      createElement(QueryClientProvider, { client: queryClient }, createElement(Component, cellProps)),
    );
  }

  describe(`${fixture.fieldType} Cell — shared contract`, () => {
    afterEach(() => cleanup());

    // Asserts the INTENDED contract — text/Cell.tsx's own JSDoc promises an em-dash
    // placeholder. Fails for 7 of 12 types; text and array CRASH on `.length` of null,
    // taking out the whole table render — see BUGS-REPORT CELL-3.
    it.each([
      ["null", null],
      ["undefined", undefined],
    ])("renders the em-dash placeholder for a %s value", (_label, value) => {
      const { container } = renderCell({ value });
      expect(container).toHaveTextContent("—");
    });

    // Asserts the INTENDED contract: `useAsTitle` accepts any field key, so every type
    // must handle being the title column. Fails for 10 of 12 — see BUGS-REPORT CELL-1.
    it("wraps the value in an edit link to the document when isTitleField is true", () => {
      const { container } = renderCell({ value: fixture.valid, isTitleField: true, id: TITLE_ROW_ID });
      const link = container.querySelector("a");
      expect(link).not.toBeNull();
      expect(link?.getAttribute("href")).toBe(`/admin/${collection.slug}/${TITLE_ROW_ID}`);
    });

    if (truncates !== false) {
      const threshold = truncates;
      // Asserts the INTENDED contract. Fails for 6 of 12 — upload uses CSS-only
      // ellipsis and group sets no title attribute at all — see BUGS-REPORT CELL-2.
      it(`truncates a value past ${threshold} characters and keeps the full value on a title attribute`, () => {
        const longValue = buildOverLengthValue(fixture.valid, threshold);
        const { container } = renderCell({ value: longValue });
        const titled = container.querySelector("[title]");
        expect(titled).not.toBeNull();
        expect(titled?.getAttribute("title")?.length ?? 0).toBeGreaterThan(threshold);
      });
    }

    it("has zero accessibility violations", async () => {
      const { container } = renderCell({ value: fixture.valid });
      await expectNoA11yViolations(container);
    });

    extra?.(options);
  });
}
