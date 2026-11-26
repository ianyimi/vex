import { ADMIN_FIELDS } from "../constants";
import { isInt64NumberField } from "../number/utils";
import { getDataFields } from "../utils";
import type { AdminDataField, AdminField } from "../types";
import type { VariantField, VariantMemberConfig } from "./types";

/** Runtime JS type a variant member's stored value takes on. */
export const VARIANT_MEMBER_KINDS = {
  string: "string",
  number: "number",
  bigint: "bigint",
  boolean: "boolean",
  bytes: "bytes",
  array: "array",
  object: "object",
  unknown: "unknown",
} as const;

/** One of {@link VARIANT_MEMBER_KINDS}. */
export type VariantMemberKind = (typeof VARIANT_MEMBER_KINDS)[keyof typeof VARIANT_MEMBER_KINDS];

/**
 * Classifies the runtime kind a primitive `variant()` member's STORED value
 * takes on, from its field config — the check `variant()` uses to reject two
 * members sharing a kind, and to reject `json()` (whose stored shape is
 * unknowable ahead of time) outright.
 *
 * `number()`'s `Int64NumberField` variant (`isInt64NumberField`) classifies as
 * `"bigint"`, not `"number"`. `select()`/`relationship()`/`upload()` classify as `"string"`
 * only when scalar-stored (`field.schema !== undefined`) — otherwise (the
 * array-storage default) they classify as `"array"`, same as a bare `array()`.
 *
 * @param props.field - The member's resolved field definition.
 * @returns One of {@link VARIANT_MEMBER_KINDS}; `"unknown"` for a field whose
 *   stored shape cannot be classified ahead of time (`json()`, or a nested
 *   primitive `variant()`, whose own members may themselves vary in kind).
 */
export function classifyVariantMemberKind(props: { field: AdminDataField }): VariantMemberKind {
  const { field } = props;
  switch (field.type) {
    case ADMIN_FIELDS.text.type:
    case ADMIN_FIELDS.email.type:
    case ADMIN_FIELDS.textarea.type:
    case ADMIN_FIELDS.url.type:
    case ADMIN_FIELDS.color.type:
      return VARIANT_MEMBER_KINDS.string;
    case ADMIN_FIELDS.number.type:
      return isInt64NumberField(field) ? VARIANT_MEMBER_KINDS.bigint : VARIANT_MEMBER_KINDS.number;
    case ADMIN_FIELDS.checkbox.type:
      return VARIANT_MEMBER_KINDS.boolean;
    case ADMIN_FIELDS.date.type:
    case ADMIN_FIELDS.commitTs.type:
      return VARIANT_MEMBER_KINDS.number;
    case ADMIN_FIELDS.select.type:
    case ADMIN_FIELDS.relationship.type:
    case ADMIN_FIELDS.upload.type:
      return !field.hasMany && field.schema !== undefined
        ? VARIANT_MEMBER_KINDS.string
        : VARIANT_MEMBER_KINDS.array;
    case ADMIN_FIELDS.array.type:
    case ADMIN_FIELDS.blocks.type:
    case ADMIN_FIELDS.richtext.type:
      return VARIANT_MEMBER_KINDS.array;
    case ADMIN_FIELDS.group.type:
    case ADMIN_FIELDS.keyValue.type:
      return VARIANT_MEMBER_KINDS.object;
    case ADMIN_FIELDS.bytes.type:
      return VARIANT_MEMBER_KINDS.bytes;
    case ADMIN_FIELDS.variant.type:
      return field.discriminator !== undefined ? VARIANT_MEMBER_KINDS.object : VARIANT_MEMBER_KINDS.unknown;
    default:
      return VARIANT_MEMBER_KINDS.unknown;
  }
}

/**
 * Classifies a primitive `variant()`'s STORED VALUE at runtime — the
 * active-member lookup the admin form (on load) uses, and the same lookup
 * `documents/cloneDocumentForDuplicate.ts` and `fields/blocks/utils.ts` use
 * to recover which member a stored value belongs to before cloning/seeding
 * it fresh. A nullish value is its own kind (a nullable member's cleared
 * value), never collapsed into one of the data kinds.
 *
 * @param value - The field's current stored/form value.
 * @returns One of {@link VARIANT_MEMBER_KINDS}, or `"null"` for a nullish value.
 */
export function classifyVariantValueKind(value: unknown): VariantMemberKind | "null" {
  if (value === null || value === undefined) return "null";
  if (value instanceof ArrayBuffer) return VARIANT_MEMBER_KINDS.bytes;
  if (Array.isArray(value)) return VARIANT_MEMBER_KINDS.array;
  if (typeof value === "bigint") return VARIANT_MEMBER_KINDS.bigint;
  if (typeof value === "number") return VARIANT_MEMBER_KINDS.number;
  if (typeof value === "boolean") return VARIANT_MEMBER_KINDS.boolean;
  if (typeof value === "string") return VARIANT_MEMBER_KINDS.string;
  if (typeof value === "object") return VARIANT_MEMBER_KINDS.object;
  return VARIANT_MEMBER_KINDS.unknown;
}

/**
 * Resolves the seed value for one variant member/sub-field when the admin
 * picker switches to it — `field.defaultValue ?? null`, same as every
 * field type. `number()` no longer needs a special case here: its own
 * project-wide default is `undefined` (`ADMIN_FIELDS.number.defaultValue`),
 * same as every other scalar's "no author default" state, so a brand-new
 * variant selection already starts empty unless the author configured an
 * explicit `defaultValue` — which this now correctly honors, instead of
 * always discarding it.
 *
 * @param field - The member's/sub-field's resolved field definition.
 * @returns `field.defaultValue ?? null`.
 */
export function resolveVariantMemberSeedDefault(field: AdminDataField): unknown {
  return field.defaultValue ?? null;
}

/**
 * Builds the default value for a discriminated variant's member when the
 * admin picker switches to it (or resets a cleared field) — the discriminator
 * literal plus each sub-field initialised via {@link resolveVariantMemberSeedDefault}.
 * Mirrors `blocks/utils.ts`'s `buildDefaultBlock`.
 *
 * @param props.discriminator - The field's own `discriminator` property name.
 * @param props.key - The variant's own key (the discriminant value to write).
 * @param props.member - The resolved variant member to build defaults for.
 * @returns A new object: `{ [discriminator]: key, ...subFieldDefaults }`.
 */
export function buildDefaultVariantMember(props: {
  discriminator: string;
  key: string;
  member: VariantMemberConfig;
}): Record<string, unknown> {
  const dataFields = getDataFields({ fields: props.member.fields });
  const fieldDefaults = Object.fromEntries(
    Object.entries(dataFields).map(([key, subField]) => [key, resolveVariantMemberSeedDefault(subField)]),
  );
  return { [props.discriminator]: props.key, ...fieldDefaults };
}

/**
 * Resolves a `variant()` value's active member and walks each of the
 * member's reachable sub-fields through a caller-supplied recursive
 * walker — the shared dispatch `fields/blocks/utils.ts`'s
 * `cloneNestedBlockIds`, `documents/cloneDocumentForDuplicate.ts`'s
 * `regenerateNestedIds`, and `fields/array/utils.ts`'s `backfillFieldValue`
 * all delegate to for a `variant()`-typed field, instead of each
 * re-deriving the same discriminated/primitive active-member lookup.
 * Discriminated mode resolves the member by the stored discriminator key;
 * primitive mode resolves it by {@link classifyVariantValueKind}, mirroring
 * the admin form's own active-member lookup.
 *
 * @param props.value - The current value at `props.field`'s path.
 * @param props.field - The `variant()` field definition describing
 *   `props.value`'s shape.
 * @param props.recurse - The caller's own per-field walker, invoked once
 *   per reachable sub-field key present in `props.value` (discriminated
 *   mode) or once with the whole value and the resolved member's own field
 *   definition (primitive mode).
 * @returns `props.value` unchanged if no member resolves (discriminated: no
 *   match for the stored discriminator key; primitive: no member's kind
 *   matches the value's own); otherwise a new value with every reachable
 *   sub-field walked through `props.recurse`.
 */
export function walkVariantValue(props: {
  value: unknown;
  field: VariantField;
  recurse: (props: { value: unknown; field: AdminField }) => unknown;
}): unknown {
  const { value, field, recurse } = props;
  if (value == null) return value;
  if (field.discriminator !== undefined) {
    const discriminator = field.discriminator;
    const variantValue = value as Record<string, unknown>;
    const key = variantValue[discriminator];
    const member = typeof key === "string" ? field.variants[key] : undefined;
    if (!member) return value;
    const result: Record<string, unknown> = { ...variantValue };
    for (const [subKey, subField] of Object.entries(member.fields)) {
      if (subKey in variantValue) {
        result[subKey] = recurse({ value: variantValue[subKey], field: subField });
      }
    }
    return result;
  }
  const kind = classifyVariantValueKind(value);
  const member = Object.values(field.variants).find(
    (candidate) => classifyVariantMemberKind({ field: candidate }) === kind,
  );
  return member ? recurse({ value, field: member }) : value;
}
