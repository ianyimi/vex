import { ConvexError, type Value } from "convex/values";
import * as z from "zod";
import type { ZodType } from "zod";
import { AdminDataField, AdminField } from "./types";
import { ADMIN_FIELDS } from "./constants";
import { group } from "./group/config";
import type { FieldCondition } from "./ui/types";
import type { UIField } from "./ui/ui/types";
import { adminFieldToInputSchema } from "./inputSchemas";
import { createVexCallbackApi, type VexCallbackApi } from "../api/server";
import type { VexConfig } from "../config";
import type { TDocument } from "../api/convex";
import type { VexMutationCtx } from "../types/generated";
import { FieldLimit, FieldLimitInput } from "./baseTypes";
import type {
  ComponentContributionInput,
  ComponentOverrideInput,
} from "../components/types";
import {
  resolveComponentContributions,
  resolveComponentOverrides,
} from "../components/resolve";
import { SLOT_IDS } from "../components/types";

/**
 * Resolves a field's `min`/`max` input into its final `[value, error]`
 * tuple. A bare number input is paired with `defaultError(value)`; a
 * `[value, error]` tuple input is returned as-is; `undefined` stays
 * `undefined` (no constraint configured).
 *
 * @param props - Input props.
 * @param props.limit - The field's raw `min`/`max` input.
 * @param props.defaultError - Builds the default error message from the
 *   resolved value, when `limit` is a bare number. Ignored when `limit` is
 *   already a `[value, error]` tuple.
 * @returns The resolved `[value, error]` tuple, or `undefined`.
 *
 * @example
 * ```ts
 * resolveFieldLimit({ limit: 3, defaultError: () => "Too short." })
 * // → [3, "Too short."]
 *
 * resolveFieldLimit({ limit: [3, "Need 3+ chars."], defaultError: () => "Too short." })
 * // → [3, "Need 3+ chars."]
 *
 * resolveFieldLimit({ limit: undefined, defaultError: () => "Too short." })
 * // → undefined
 * ```
 */
export function resolveFieldLimit(props: {
  limit: FieldLimitInput | undefined;
  defaultError: (value: number) => string;
}): FieldLimit | undefined {
  if (props.limit === undefined) return undefined;
  if (typeof props.limit === "number") {
    return [props.limit, props.defaultError(props.limit)] as const;
  }
  return props.limit;
}

/**
 * Resolves one field's `admin.components` input into the always-present resolved shape every
 * field factory stamps onto `FieldAdminConfig.components`. Field-level lists have no built-ins
 * to merge (every field-level contribution is project/plugin-authored, S6) — this only de-
 * duplicates and orders the field's OWN list via {@link resolveComponentContributions}/
 * {@link resolveComponentOverrides}.
 *
 * @param props.components - The raw `admin.components` input, or `undefined` for a field with no
 *   customization.
 * @returns The resolved `components` object — every list defaulted to `[]`.
 * @throws {VexComponentConfigError} When one of the field's own lists has a duplicate id.
 */
export function resolveFieldComponents(props: {
  components?: {
    Input?: ComponentOverrideInput<any, unknown>[];
    Cell?: ComponentOverrideInput<any, unknown>[];
    Label?: ComponentOverrideInput<any, unknown>[];
    Description?: ComponentOverrideInput<any, unknown>[];
    beforeInput?: ComponentContributionInput<any, unknown>[];
    afterInput?: ComponentContributionInput<any, unknown>[];
  };
}) {
  const input = props.components ?? {};
  return {
    Input: resolveComponentOverrides({
      slotId: SLOT_IDS.field.input,
      overrides: input.Input ?? [],
    }),
    Cell: resolveComponentOverrides({
      slotId: SLOT_IDS.field.cell,
      overrides: input.Cell ?? [],
    }),
    Label: resolveComponentOverrides({
      slotId: SLOT_IDS.field.label,
      overrides: input.Label ?? [],
    }),
    Description: resolveComponentOverrides({
      slotId: SLOT_IDS.field.description,
      overrides: input.Description ?? [],
    }),
    beforeInput: resolveComponentContributions({
      slotId: SLOT_IDS.field.beforeInput,
      contributions: input.beforeInput ?? [],
    }),
    afterInput: resolveComponentContributions({
      slotId: SLOT_IDS.field.afterInput,
      contributions: input.afterInput ?? [],
    }),
  };
}

/**
 * Wraps a string into lines that do not exceed `maxLen` characters, splitting
 * on word boundaries.
 *
 * Used by `adminFieldToJSDocComment` to keep JSDoc comment lines within the
 * conventional 80-character limit before emitting them into generated source files.
 *
 * @param props - Input props.
 * @param props.text - The string to wrap.
 * @param props.maxLen - Maximum character length per line.
 * @returns An array of strings, each no longer than `maxLen` characters.
 *
 * @example
 * ```ts
 * wrapLines({ text: "This is a long description that should wrap.", maxLen: 20 })
 * // → ["This is a long", "description that", "should wrap."]
 * ```
 */
export function wrapLines(props: { text: string; maxLen: number }): string[] {
  const words = props.text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (current && current.length + 1 + word.length > props.maxLen) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Builds a tab-indented JSDoc comment block for a field's description.
 *
 * Reads `field.interfaceDescription` first, falling back to `field.description`.
 * Returns an empty string when neither is set. The output is ready to insert
 * directly above a property line in a generated TypeScript interface — lines are
 * wrapped at 80 characters via `wrapLines`.
 *
 * @param props - Input props.
 * @param props.field - The resolved field definition to extract the description from.
 * @returns A tab-indented JSDoc block string ready to splice into generated
 *   TypeScript source, or an empty string if the field has no description.
 *
 * @example
 * ```ts
 * const field = text({ description: "Page title shown in browser tabs." })
 * adminFieldToJSDocComment({ field })
 * // Returns a multi-line JSDoc block wrapping the description text
 * ```
 */
export function adminFieldToJSDocComment(props: { field: AdminDataField }): string {
  let jsdocComment = "";
  const jsdoc = props.field.interfaceDescription ?? props.field.description;
  if (jsdoc) {
    const linesArray = wrapLines({
      text: jsdoc,
      maxLen: 80,
    });
    jsdocComment = `\t/**\n${linesArray.map((l) => `\t * ${l}`).join("\n")}\n\t */\n`;
  }
  return jsdocComment;
}

/**
 * Builds the Zod input schema for a field map — a collection's or a
 * global's `fields`. Hidden fields are skipped.
 *
 * @param props.fields - The resource's resolved field map.
 * @param props.partial - When true, every TOP-LEVEL field becomes optional
 *   (`update`/`saveDraft`'s lenient mode); omit for strict, full-schema
 *   validation (`create`, `publish` — decision 4).
 * @param props.ignoreRequired - When true, every field — at every nesting
 *   depth (group sub-fields, array items, blocks' block fields, and any
 *   further recursion) — is built as if `required: false` (forwarded to
 *   `adminFieldToInputSchema`'s own `ignoreRequired`). A configured
 *   `min`/`max` still applies to a non-empty value exactly as it does for an
 *   optional field today; only the "must be present/non-empty" check
 *   `required` itself adds is skipped. `saveDraft` sets this — a draft may
 *   leave a required field empty at any depth; `publish`/`create`/`update`
 *   do not.
 * @param props.data - The merged document being validated (`prepareEdit`
 *   passes `transformedFields`). When given, every field whose
 *   `admin.condition` evaluates false against `(data, siblingData)` — where
 *   a top-level field's `siblingData` is `data` itself — is built as
 *   `z.unknown()` instead of its real schema: present (so a hidden field's
 *   kept value still round-trips), but neither its `required` check nor any
 *   type/format validation runs. A nested `group`/`array`/`blocks` field
 *   threads `data` through to its own sub-fields/items so a condition
 *   anywhere in the tree is honored, not just at the top level. Omit to
 *   keep today's behavior — every field validated regardless of
 *   `admin.condition` — unchanged, for every caller that doesn't track live
 *   form values.
 * @returns The object schema.
 *
 * @example
 * ```ts
 * const schema = getFieldsInputSchema({ fields: posts.fields, partial: true });
 * ```
 */
export function getFieldsInputSchema(props: {
  fields: Record<string, AdminField>;
  partial?: boolean;
  ignoreRequired?: boolean;
  data?: Record<string, unknown>;
}) {
  const res: Record<string, ZodType> = {};
  for (const [fieldKey, fieldDef] of Object.entries(getDataFields({ fields: props.fields }))) {
    if (fieldDef.admin.hidden) continue;
    res[fieldKey] = adminFieldToInputSchema({
      field: fieldDef,
      ignoreRequired: props.ignoreRequired,
      data: props.data,
      siblingData: props.data,
      key: fieldKey,
    });
  }
  const schema = z.object({ ...res });
  return props.partial ? schema.partial() : schema;
}

/**
 * Builds TanStack Form `defaultValues` from a field map — a collection's or a
 * global's `fields`. Hidden fields are skipped. With `document` (edit mode),
 * a truthy stored value wins; otherwise each field's `defaultValue`.
 *
 * @param props.fields - The resource's resolved field map.
 * @param props.document - Optional stored document (edit mode); `null`/omitted = create mode.
 * @returns One key per visible field.
 *
 * @example
 * ```ts
 * getFieldsDefaultValues({ fields: posts.fields })              // → { title: "", slug: "" }
 * getFieldsDefaultValues({ fields: posts.fields, document: doc }) // → { title: "Hello", slug: "hello" }
 * ```
 */
export function getFieldsDefaultValues(props: {
  fields: Record<string, AdminField>;
  document?: TDocument | Record<string, unknown> | null;
}) {
  const res: Record<string, unknown> = {};
  for (const [fieldKey, fieldDef] of Object.entries(getDataFields({ fields: props.fields }))) {
    if (fieldDef.admin.hidden) continue;
    if (props.document && Boolean(props.document[fieldKey])) {
      res[fieldKey] = props.document[fieldKey];
    } else {
      res[fieldKey] = fieldDef.defaultValue;
    }
  }
  return res;
}

/**
 * Renders one `CollectionsFieldTypeMap` / `GlobalsFieldTypeMap` entry for the
 * generated `declare module '@vexcms/core'` block: each field type present,
 * mapped to the union of field keys of that type.
 *
 * No synthetic `id: "_id"` entry: this is a field-TYPE index, and `_id` is not
 * a field type (access helpers derive field names from the document itself).
 *
 * @param props.key - The map key — the collection or global slug.
 * @param props.fields - The resource's resolved field map.
 * @returns TypeScript source for one entry, without wrapping braces.
 *
 * @example
 * ```ts
 * fieldsToFieldTypeMap({ key: "posts", fields: posts.fields });
 * // → '\tposts: {\n\t\ttext: "title"\n\t\trelationship: "author"\n\t}'
 * ```
 */
export function fieldsToFieldTypeMap(props: {
  key: string;
  fields: Record<string, AdminField>;
}): string {
  const byType = Object.entries(getDataFields({ fields: props.fields })).reduce<Record<string, string[]>>(
    (acc, [fieldKey, field]) => {
      (acc[field.type] ??= []).push(`"${fieldKey}"`);
      return acc;
    },
    {},
  );
  const body = Object.entries(byType)
    .map(([fieldType, keys]) => `\t\t${fieldType}: ${keys.join(" | ")}\n`)
    .join("");
  return `\t${props.key}: {\n${body}\t}`;
}

/**
 * Runs each changed field's `validate()` against the merged document, skipping
 * fields whose key isn't in `keys` (unchanged on `update`, every field on
 * `create`), that don't define `validate`, or whose `admin.condition`
 * evaluates false — a condition-hidden field's `validate()` never runs,
 * matching `getFieldsInputSchema`'s schema-level skip (Step 9). `doc` stands
 * in for both `data` and `siblingData` here: `validateFields` only ever runs
 * a TOP-LEVEL field's own `validate()` (a `group`/`array`/`blocks`
 * sub-field's `validate()`, if any, runs through the container field's own
 * value, not individually), so the two are the same object at this depth —
 * exactly like `getFieldsInputSchema`'s top-level fields, where `siblingData`
 * is `data` itself.
 *
 * A field reports failure by **throwing**, not by returning a message: a
 * thrown error carries a stack, can be a project's own error subclass, and can
 * attach arbitrary structured data through `ConvexError`. A returned string
 * could carry none of that, and made the success path (`return undefined`)
 * easy to hit by accident.
 *
 * Whatever a field throws is re-thrown as a `ConvexError` carrying the field
 * key, so the admin panel can attribute the failure to one input. A
 * `ConvexError`'s own `data` is preserved verbatim — an object payload is
 * merged with `field`, a plain-string payload becomes `message` — so a project
 * can surface codes or hints of its own.
 *
 * @param props - The resource's field map (a collection's or a global's), resolved document, changed field keys, mutation
 *   ctx, and resolved config (needed to build the `vex` api each callback receives).
 * @returns Nothing; resolves once every applicable field's `validate()` has passed.
 * @throws {ConvexError} With `{ field, message, ... }` for the first field that throws.
 */
export async function validateFields(props: {
  fields: Record<string, AdminField>;
  doc: Record<string, unknown>;
  keys: Iterable<string>;
  ctx: VexMutationCtx;
  config: VexConfig;
}): Promise<void> {
  const keys = new Set(props.keys);
  // Built once per write, not per field: it closes over nothing field-specific.
  const vex = createVexCallbackApi({ ctx: props.ctx, config: props.config });
  for (const [fieldKey, field] of Object.entries(getDataFields({ fields: props.fields }))) {
    if (!keys.has(fieldKey) || !field.validate) continue;
    if (!isFieldConditionMet({ field, data: props.doc, siblingData: props.doc })) continue;
    const validate = field.validate as unknown as (props: {
      value: unknown;
      doc: Record<string, unknown>;
      fieldKey: string;
      field: unknown;
      ctx: VexMutationCtx;
      vex: VexCallbackApi;
    }) => Promise<void> | void;

    try {
      await validate({
        value: props.doc[fieldKey],
        doc: props.doc,
        fieldKey,
        field,
        ctx: props.ctx,
        vex,
      });
    } catch (thrown) {
      throw toFieldValidationError({ thrown, fieldKey });
    }
  }
}

/**
 * Normalises whatever a field's `validate()` threw into one `ConvexError`
 * shape, so every consumer reads the failure the same way regardless of what
 * the project chose to throw.
 *
 * @param props.thrown - The value the field threw.
 * @param props.fieldKey - The field that rejected the write.
 * @returns A `ConvexError` whose data always carries `field` and `message`.
 */
function toFieldValidationError(props: { thrown: unknown; fieldKey: string }): ConvexError<Value> {
  const { thrown, fieldKey } = props;

  if (thrown instanceof ConvexError) {
    const data = thrown.data as unknown;
    return new ConvexError(
      typeof data === "object" && data !== null
        ? ({ message: "Validation failed", ...data, field: fieldKey } as Value)
        : { message: String(data), field: fieldKey },
    );
  }

  return new ConvexError({
    message: thrown instanceof Error ? thrown.message : String(thrown),
    field: fieldKey,
  });
}

// ---------------------------------------------------------------------------
// Field traversal, conditions and row layout
// ---------------------------------------------------------------------------

/**
 * Combines several optional field conditions into one that is met only when
 * every defined condition is met (logical AND). Returns `undefined` when no
 * condition is defined. A throwing condition counts as met (`true`),
 * matching `isFieldConditionMet`.
 *
 * @returns The combined condition, or `undefined` if `props.conditions` has
 *   no defined entries.
 */
export function andFieldConditions(props: {
  conditions: (FieldCondition | undefined)[];
}): FieldCondition | undefined {
  const defined = props.conditions.filter(
    (condition): condition is FieldCondition => condition !== undefined,
  );
  if (defined.length === 0) return undefined;
  return (conditionProps) =>
    defined.every((condition) => {
      try {
        return condition(conditionProps);
      } catch {
        return true;
      }
    });
}

/**
 * Evaluates whether a field's `admin.condition` is currently met. A field
 * with no condition is always met. A condition that throws counts as met —
 * the failure must be visible elsewhere, never a silent validation skip.
 *
 * `field.admin.condition` is declared via method shorthand (bivariant —
 * see `baseTypes.ts`'s `FieldAdminConfigInput`), nominally typed against
 * whatever `TCollectionSlug` the field was authored with. This function
 * operates on live run-time `data`/`siblingData` (`Record<string,
 * unknown>`, not a nominal document type), so it casts the condition to
 * that plain shape before calling it — the exact same escape hatch
 * `validateFields` already uses for `field.validate` in `fields/utils.ts`.
 *
 * @returns `true` if the field has no condition, or if its condition
 *   evaluates (or throws) to a met state; `false` otherwise.
 */
export function isFieldConditionMet(props: {
  field: AdminField;
  data: Record<string, unknown>;
  siblingData: Record<string, unknown>;
}): boolean {
  const { field, data, siblingData } = props;
  const condition = field.admin.condition as unknown as
    | ((props: { data: Record<string, unknown>; siblingData: Record<string, unknown> }) => boolean)
    | undefined;
  if (!condition) return true;
  try {
    return condition({ data, siblingData });
  } catch {
    return true;
  }
}

/**
 * Whether any field in `fields` — or any of its nested group sub-fields,
 * array item fields, or block fields — declares an `admin.condition`. Used
 * to decide whether a form needs condition-aware re-validation at all.
 *
 * @returns `true` if any field in `props.fields` (including nested
 *   group/array/block fields) declares an `admin.condition`.
 */
export function hasFieldConditions(props: {
  fields: Record<string, AdminField>;
}): boolean {
  return Object.values(props.fields).some((field) => {
    if (field.admin.condition) return true;
    if (field.type === ADMIN_FIELDS.group.type) {
      return hasFieldConditions({ fields: field.fields });
    }
    if (field.type === ADMIN_FIELDS.array.type) {
      return hasFieldConditions({ fields: { item: field.items } });
    }
    if (field.type === ADMIN_FIELDS.blocks.type) {
      return field.blocks.some((block) =>
        hasFieldConditions({ fields: block.fields }),
      );
    }
    return false;
  });
}

function formatEqualShare(count: number): string {
  return `${Math.round((100 / count) * 100) / 100}%`;
}

function parsePercentWidth(width: string): number | undefined {
  const match = /^(\d+(?:\.\d+)?)%$/.exec(width);
  return match ? Number(match[1]) : undefined;
}

/**
 * Resolves the widths a `row()` lays its children out with. When every
 * child's `admin.width` is a `%` value and they sum to 100 (±0.5 — floating
 * point rounding slop), those declared widths are used as-is; otherwise
 * every child gets an equal share of the row.
 *
 * @returns The resolved width for each entry in `props.widths`, in order.
 */
export function resolveRowWidths(props: { widths: string[] }): string[] {
  const { widths } = props;
  const percents = widths.map(parsePercentWidth);
  const allPercent = percents.every(
    (value): value is number => value !== undefined,
  );
  if (allPercent) {
    const sum = percents.reduce<number>(
      (total, value) => total + (value ?? 0),
      0,
    );
    if (Math.abs(sum - 100) <= 0.5) return widths;
  }
  const share = formatEqualShare(widths.length);
  return widths.map(() => share);
}

/**
 * Flattens a `fields` record — legal at any nesting level a `fields` record
 * appears (a collection's/global's own top-level `fields`, a `group()`'s
 * `fields`, a group-shaped `array()`'s `items`, a `blocks()` block's own
 * `fields`) — down to the data fields
 * every schema/validation/type-gen/RBAC/index/version/list-column/
 * default-value consumer needs: `ui()` entries are dropped; an unnamed
 * `tabs()` tab's, or a `row()`'s/`collapsible()`'s, children are hoisted up
 * to this level (recursively, so a hoisted child that is itself a UI field
 * is flattened too); a NAMED tab becomes one `group()`-shaped data field
 * keyed by the tab's own `name`, built via the real `group()` factory so it
 * carries every default a hand-built group field would. Every UI
 * container's own `admin.condition` is AND-ed into each field it flattens
 * through `andFieldConditions` — a field hidden by its tab's/row's/
 * collapsible's condition is exactly as hidden as one hidden by its own.
 * Likewise `admin.hidden`/`admin.readOnly` are OR-ed in: a field under a
 * hidden/read-only container is itself hidden/read-only even if its own
 * flag says otherwise — a container can only ever make a descendant MORE
 * restricted, never less.
 *
 * @throws {Error} When two entries flatten to the same data key (two fields
 *   named the same, a named tab reusing a sibling's key, two tabs sharing a
 *   `name`, …).
 * @returns The flattened data fields, keyed by their resolved data key.
 */
export function getDataFields(props: {
  fields: Record<string, AdminField>;
}): Record<string, AdminDataField> {
  return flattenFields({
    fields: props.fields,
    inherited: undefined,
    inheritedHidden: false,
    inheritedReadOnly: false,
  });
}

function flattenFields(props: {
  fields: Record<string, AdminField>;
  inherited: FieldCondition | undefined;
  inheritedHidden: boolean;
  inheritedReadOnly: boolean;
}): Record<string, AdminDataField> {
  const result: Record<string, AdminDataField> = {};
  const assign = (key: string, field: AdminDataField): void => {
    if (key in result) {
      throw new Error(`getDataFields(): duplicate field key "${key}"`);
    }
    result[key] = field;
  };
  const merge = (nested: Record<string, AdminDataField>): void => {
    for (const [key, field] of Object.entries(nested)) assign(key, field);
  };

  for (const [key, field] of Object.entries(props.fields)) {
    if (ADMIN_FIELDS[field.type].kind === "data") {
      const condition = andFieldConditions({
        conditions: [props.inherited, field.admin?.condition],
      });
      assign(key, {
        ...field,
        admin: {
          ...field.admin,
          condition,
          hidden: props.inheritedHidden || field.admin?.hidden,
          readOnly: props.inheritedReadOnly || field.admin?.readOnly,
        },
      } as AdminDataField);
      continue;
    }
    switch (field.type) {
      case ADMIN_FIELDS.ui.type:
        continue;
      case ADMIN_FIELDS.row.type:
      case ADMIN_FIELDS.collapsible.type: {
        const condition = andFieldConditions({
          conditions: [props.inherited, field.admin?.condition],
        });
        merge(
          flattenFields({
            fields: field.fields,
            inherited: condition,
            inheritedHidden: props.inheritedHidden || field.admin?.hidden,
            inheritedReadOnly: props.inheritedReadOnly || field.admin?.readOnly,
          }),
        );
        continue;
      }
      case ADMIN_FIELDS.tabs.type: {
        const tabsHidden = props.inheritedHidden || field.admin?.hidden;
        const tabsReadOnly = props.inheritedReadOnly || field.admin?.readOnly;
        const tabsCondition = andFieldConditions({
          conditions: [props.inherited, field.admin?.condition],
        });
        for (const tab of field.tabs) {
          const tabCondition = andFieldConditions({
            conditions: [tabsCondition, tab.admin?.condition],
          });
          if (tab.name !== undefined) {
            assign(
              tab.name,
              group({
                label: tab.label,
                description: tab.description,
                fields: flattenFields({
                  fields: tab.fields,
                  inherited: tabCondition,
                  inheritedHidden: tabsHidden,
                  inheritedReadOnly: tabsReadOnly,
                }),
                admin: { condition: tabCondition, hidden: tabsHidden, readOnly: tabsReadOnly },
              }) as AdminDataField,
            );
          } else {
            merge(
              flattenFields({
                fields: tab.fields,
                inherited: tabCondition,
                inheritedHidden: tabsHidden,
                inheritedReadOnly: tabsReadOnly,
              }),
            );
          }
        }
        continue;
      }
    }
  }
  return result;
}

/**
 * Collects every `ui()` field whose `admin.components.Cell` is set,
 * reachable by hoisting through `tabs()`/`row()`/`collapsible()` nesting —
 * the same traversal `getDataFields` itself uses for data fields, except
 * `getDataFields` explicitly DROPS `ui()` entries (its own doc comment:
 * "ui() entries are dropped"), so list-column generation needs this sibling
 * function instead. Does not descend into `group()`/`array()`/`blocks()`:
 * their own sub-fields never surface as a top-level list column, so a
 * `ui()` field nested inside one of those doesn't either — same scope
 * `getDataFields` itself stops at (a `group`/`array`/`blocks` field is
 * assigned as-is, never expanded).
 *
 * A named tab's `ui()` field has no stored value to nest under that tab's
 * own group-shaped data key, so it is instead keyed `"<tabName>.<key>"` —
 * unique enough for a TanStack Table column `id`, which is all a `ui()`
 * field's column needs (its `Cell` reads `data` directly, never
 * `row.getValue`).
 *
 * @see {@link getDataFields} for the data-field counterpart this mirrors.
 * @returns The `ui()` fields with a `Cell` component, keyed by their
 *   resolved column id (dotted with the tab name for a named tab).
 */
export function getUIFieldsWithCell(props: {
  fields: Record<string, AdminField>;
}): Record<string, UIField> {
  const result: Record<string, UIField> = {};
  const walk = (fields: Record<string, AdminField>, prefix: string | undefined): void => {
    for (const [key, field] of Object.entries(fields)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (field.type === ADMIN_FIELDS.ui.type) {
        if (field.admin.components.Cell) result[fullKey] = field;
        continue;
      }
      switch (field.type) {
        case ADMIN_FIELDS.row.type:
        case ADMIN_FIELDS.collapsible.type:
          walk(field.fields, prefix);
          continue;
        case ADMIN_FIELDS.tabs.type:
          for (const tab of field.tabs) {
            const tabPrefix =
              tab.name !== undefined ? (prefix ? `${prefix}.${tab.name}` : tab.name) : prefix;
            walk(tab.fields, tabPrefix);
          }
          continue;
        default:
          continue;
      }
    }
  };
  walk(props.fields, undefined);
  return result;
}
