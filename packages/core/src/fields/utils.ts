import * as z from "zod";
import type { ZodType } from "zod";
import { AdminDataField, AdminField } from "./types";
import { ADMIN_FIELDS } from "./constants";
import { group } from "./group/config";
import type { FieldCondition } from "./conditions";
import type { UIField } from "./ui/types";
import { adminFieldToInputSchema } from "./inputSchemas";
import type { TDocument } from "../documents/types";
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
 * tuple. A bare `number`/`bigint` input is paired with `defaultError(value)`;
 * a `[value, error]` tuple input is returned as-is; `undefined` stays
 * `undefined` (no constraint configured). Generic over `number | bigint` so
 * an int64 `number()` field can resolve `bigint` limits through the same
 * helper every other field type uses.
 *
 * @param props - Input props.
 * @param props.limit - The field's raw `min`/`max` input.
 * @param props.defaultError - Builds the default error message from the
 *   resolved value, when `limit` is a bare value. Ignored when `limit` is
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
 *
 * resolveFieldLimit<bigint>({ limit: 5n, defaultError: (value) => `At least ${value}.` })
 * // → [5n, "At least 5."]
 * ```
 */
export function resolveFieldLimit<T extends number | bigint = number>(props: {
  limit: T | readonly [value: T, error: string] | undefined;
  defaultError: (value: T) => string;
}): readonly [value: T, error: string] | undefined {
  if (props.limit === undefined) return undefined;
  if (Array.isArray(props.limit)) return props.limit as readonly [value: T, error: string];
  const value = props.limit as T;
  return [value, props.defaultError(value)] as const;
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
    Field?: ComponentOverrideInput<any, unknown>[];
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
    Field: resolveComponentOverrides({
      slotId: SLOT_IDS.field.field,
      overrides: input.Field ?? [],
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
    if (fieldDef.type === ADMIN_FIELDS.commitTs.type) continue;
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
    const stored = props.document ? props.document[fieldKey] : undefined;
    if (fieldDef.nullable && stored === null) {
      res[fieldKey] = resolveNullableLoadValue({ field: fieldDef, value: null });
    } else if (props.document && stored !== undefined) {
      res[fieldKey] = stored;
    } else {
      res[fieldKey] = fieldDef.defaultValue;
    }
  }
  return res;
}

/**
 * Resolves a nullable field's loaded form value from its stored document
 * value. A field with no natural empty input state of its own
 * (`ADMIN_FIELDS[field.type].hasNullToggle` — group/array/blocks/json/
 * richtext/checkbox) keeps a literal `null` so its `FormFieldLayout` null
 * toggle starts active; every other nullable field's `null` becomes its own
 * `defaultValue`, since its control already shows that as "no value".
 *
 * @param props - Input props.
 * @param props.field - The resolved field definition.
 * @param props.value - The field's current value — only ever called with `null`.
 * @returns `null` for a toggle field, else `field.defaultValue`.
 */
export function resolveNullableLoadValue(props: { field: AdminDataField; value: null }): unknown {
  return ADMIN_FIELDS[props.field.type].hasNullToggle ? null : props.field.defaultValue;
}

/**
 * Resolves one field's form value for the save payload.
 *
 * `undefined` always becomes `null`, regardless of `nullable` — Convex's
 * client argument serializer drops an explicit `undefined` key before the
 * request ever reaches the server, so a cleared field with no other empty
 * representation (a scalar `relationship`/`upload`'s deselect, a `bytes`
 * control's own Clear action) would otherwise vanish from the payload
 * entirely and the stored value would never change. `null` survives the
 * wire; {@link prepareEdit} (core `db/prepareEdit.ts`) translates it back
 * on arrival — a `nullable` field stores the literal `null`, a
 * non-nullable OPTIONAL field is unset, a non-nullable REQUIRED field
 * fails its normal required validation.
 *
 * Beyond that: clearing a nullable scalar field's input (its own empty
 * representation, per {@link isDisplayValueEmpty}) also writes `null`. A
 * toggle field's value is already `null` or already a real value (set
 * directly by its own `FormFieldLayout` null toggle) and passes through
 * unchanged.
 *
 * @param props - Input props.
 * @param props.field - The resolved field definition.
 * @param props.value - The field's current form value.
 * @returns `null` when `value` is `undefined`, regardless of field type;
 *   otherwise `value`, or `null` when `field.nullable`, the field has no
 *   null toggle, and `value` is that field's own empty representation.
 */
export function resolveNullableSaveValue(props: { field: AdminDataField; value: unknown }): unknown {
  if (props.value === undefined) return null;
  if (!props.field.nullable || ADMIN_FIELDS[props.field.type].hasNullToggle) return props.value;
  return isDisplayValueEmpty(props.value) ? null : props.value;
}

/**
 * Applies {@link resolveNullableSaveValue} across a values record keyed by
 * field key — the save-path counterpart of {@link getFieldsDefaultValues}.
 * A key with no matching data field (filtered out upstream, or not a
 * declared field) passes through unchanged.
 *
 * @param props - Input props.
 * @param props.values - The form values about to be submitted.
 * @param props.fields - The resource's resolved field map.
 * @returns A new record with every field's `undefined` value, and every
 *   nullable scalar field's empty value, replaced by `null`.
 */
export function resolveNullableSaveValues(props: {
  values: Record<string, unknown>;
  fields: Record<string, AdminField>;
}): Record<string, unknown> {
  const dataFields = getDataFields({ fields: props.fields });
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props.values)) {
    const fieldDef = dataFields[key];
    result[key] = fieldDef ? resolveNullableSaveValue({ field: fieldDef, value }) : value;
  }
  return result;
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
 * Renders one `CollectionsPopulateMap` entry for the generated `declare
 * module '@vexcms/core'` block — the type-level counterpart of
 * `buildDepthPopulate`'s runtime walk, except keyed by field STRUCTURE
 * (relationship/upload leaf, or a `group`/`blocks`/`array` container to
 * recurse through) rather than by target depth.
 *
 * Only `relationship`/`upload` leaves and `group`/`blocks`/`array`/`keyValue`
 * containers that themselves carry at least one such leaf (at any depth)
 * produce an entry — a field with nothing populatable inside it (text,
 * richtext, a group of plain strings, …) is omitted entirely, so
 * `PopulateShape`/`Populated` never see it and can't recurse into it.
 *
 * `array()` is transparent here: its own map entry IS its `items` field's
 * entry (an array of relationship ids behaves like the relationship field
 * itself; an array of `group()` items behaves like the group). `tabs()` /
 * `row()` / `collapsible()` need no handling at all — `getDataFields`
 * already hoists their fields to this same level before this function
 * ever sees them.
 *
 * @param props.key - The map key — the collection or global slug.
 * @param props.fields - The resource's resolved field map.
 * @returns TypeScript source for one entry, without wrapping braces.
 *
 * @example
 * ```ts
 * fieldsToPopulateMap({ key: "posts", fields: posts.fields });
 * // → '\tposts: { author: { kind: "relationship"; target: "authors" } }'
 * ```
 */
export function fieldsToPopulateMap(props: { key: string; fields: Record<string, AdminField> }): string {
  const body = buildPopulateMapEntries({ fields: props.fields });
  return `\t${props.key}: {${body ? ` ${body} ` : ""}}`;
}

/**
 * Builds the `{ key: Entry; ... }` body for one `fields` record's populate
 * map, recursing through `group()`/`array()`/`blocks()` boundaries that
 * `getDataFields` itself stops at. @see {@link fieldsToPopulateMap}
 *
 * @returns Semicolon-joined `key: Entry` pairs, or `""` when nothing in
 *   `fields` (at any depth) is populatable.
 */
function buildPopulateMapEntries(props: { fields: Record<string, AdminField> }): string {
  return Object.entries(getDataFields({ fields: props.fields }))
    .map(([key, field]) => {
      const entry = buildPopulateMapEntry({ field });
      return entry ? `${key}: ${entry}` : null;
    })
    .filter((entry): entry is string => entry !== null)
    .join("; ");
}

/**
 * Builds one field's populate-map entry, or `null` when `field` (at any
 * depth) carries nothing populatable. @see {@link fieldsToPopulateMap}
 *
 * @returns The entry's TypeScript source (`{ kind: "..."; ... }`), or
 *   `null` when `field` is not populatable at any depth.
 */
function buildPopulateMapEntry(props: { field: AdminDataField }): string | null {
  const { field } = props;
  if (field.type === ADMIN_FIELDS.relationship.type) {
    return field.schema !== undefined
      ? `{ kind: "relationship"; target: "${field.collection.slug}"; scalar: true }`
      : `{ kind: "relationship"; target: "${field.collection.slug}" }`;
  }
  if (field.type === ADMIN_FIELDS.upload.type) {
    return field.schema !== undefined
      ? `{ kind: "upload"; target: "${field.to}"; scalar: true }`
      : `{ kind: "upload"; target: "${field.to}" }`;
  }
  if (field.type === ADMIN_FIELDS.array.type) {
    // Transparent: an array's own entry is whatever its `items` field's
    // entry would be — `items` is always `required: true` on a resolved
    // `ArrayField`, satisfying `AdminDataField` for every item type array()
    // accepts (scalars fall through to `null` below, same as any other
    // non-populatable leaf).
    return buildPopulateMapEntry({ field: field.items });
  }
  if (field.type === ADMIN_FIELDS.group.type) {
    const inner = buildPopulateMapEntries({ fields: field.fields });
    return inner ? `{ kind: "group"; fields: { ${inner} } }` : null;
  }
  if (field.type === ADMIN_FIELDS.blocks.type) {
    const blockEntries = field.blocks
      .map((block) => {
        const inner = buildPopulateMapEntries({ fields: block.fields });
        return inner ? `${block.blockType}: { ${inner} }` : null;
      })
      .filter((entry): entry is string => entry !== null);
    return blockEntries.length > 0 ? `{ kind: "blocks"; blocks: { ${blockEntries.join("; ")} } }` : null;
  }
  if (field.type === ADMIN_FIELDS.variant.type && field.discriminator !== undefined) {
    const variantEntries = Object.entries(field.variants)
      .map(([key, member]) => {
        const inner = buildPopulateMapEntries({ fields: member.fields });
        return inner ? `${key}: { ${inner} }` : null;
      })
      .filter((entry): entry is string => entry !== null);
    return variantEntries.length > 0
      ? `{ kind: "variant"; discriminator: "${field.discriminator}"; variants: { ${variantEntries.join("; ")} } }`
      : null;
  }
  if (field.type === ADMIN_FIELDS.keyValue.type) {
    const inner = buildPopulateMapEntry({ field: field.value });
    return inner ? `{ kind: "record"; value: ${inner} }` : null;
  }
  return null;
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
    if (field.type === ADMIN_FIELDS.keyValue.type) {
      return hasFieldConditions({ fields: { value: field.value } });
    }
    if (field.type === ADMIN_FIELDS.blocks.type) {
      return field.blocks.some((block) =>
        hasFieldConditions({ fields: block.fields }),
      );
    }
    if (field.type === ADMIN_FIELDS.variant.type) {
      return field.discriminator !== undefined
        ? Object.values(field.variants).some((member) => hasFieldConditions({ fields: member.fields }))
        : Object.values(field.variants).some((member) => hasFieldConditions({ fields: { member } }));
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

/**
 * Collects every `ui()` field's resolved key, reachable by hoisting through
 * `tabs()`/`row()`/`collapsible()` nesting — the general counterpart of
 * {@link getUIFieldsWithCell} (which additionally requires an
 * `admin.components.Cell`, for list-column generation specifically). A
 * caller that needs to know about EVERY `ui()` field a collection
 * declares — not just the ones with a list column — uses this instead
 * (access-system-fields plan: UI fields are gateable in a
 * `FieldPermissionMap` "under the same rule" as data fields, so a caller
 * counting hidden fields, e.g. the Inspect peek's own notice, needs the
 * FULL set, `Cell` or not).
 *
 * Same scope/traversal as {@link getUIFieldsWithCell}: does not descend
 * into `group()`/`array()`/`blocks()` (their own `ui()` sub-fields never
 * surface as a top-level column OR a top-level peek row either — both
 * consumers only ever ask about TOP-LEVEL UI fields); a named tab's
 * `ui()` field is keyed `"<tabName>.<key>"`, matching how a DATA field in
 * the same named tab is addressed (`getDataFields`'s own group-shaped key).
 *
 * @see {@link getUIFieldsWithCell} for the Cell-only counterpart this mirrors.
 * @returns Every `ui()` field's resolved key.
 */
export function getUIFieldKeys(props: { fields: Record<string, AdminField> }): string[] {
  const result: string[] = [];
  const walk = (fields: Record<string, AdminField>, prefix: string | undefined): void => {
    for (const [key, field] of Object.entries(fields)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (field.type === ADMIN_FIELDS.ui.type) {
        result.push(fullKey);
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

/**
 * Whether a field's value counts as empty for a READ-ONLY display's own
 * "—" placeholder and its copy button's disabled state — `undefined`,
 * `null`, `""`, or an empty array. Deliberately narrower than JS
 * truthiness: `0` and `false` are legitimate non-empty values for a
 * `number`/`checkbox` field, so neither counts as empty here.
 *
 * Shared by every `Display` component's own "—" check and the peek's
 * copy button (polish round) — one rule, not two definitions of
 * "nothing to show" that could drift apart.
 *
 * @param value - The raw field value to test.
 * @returns `true` for `undefined`/`null`/`""`/`[]`, `false` otherwise.
 */
export function isDisplayValueEmpty(value: unknown): boolean {
  if (value === undefined || value === null || value === "") return true;
  return Array.isArray(value) && value.length === 0;
}
