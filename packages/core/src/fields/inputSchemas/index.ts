import * as z from "zod";
import { ADMIN_FIELDS, type AdminFieldType } from "../constants";
import { AdminDataField } from "../types";
import { textFieldToInputSchema } from "../text";
import { emailFieldToInputSchema } from "../email";
import { textareaFieldToInputSchema } from "../textarea";
import { numberFieldToInputSchema } from "../number";
import { checkboxFieldToInputSchema } from "../checkbox";
import { dateFieldToInputSchema } from "../date";
import { selectFieldToInputSchema } from "../select";
import { urlFieldToInputSchema } from "../url";
import { colorFieldToInputSchema } from "../color";
import { relationshipFieldToInputSchema } from "../relationship";
import { arrayFieldToInputSchema } from "../array";
import { groupFieldToInputSchema } from "../group";
import { blocksFieldToInputSchema } from "../blocks";
import { uploadFieldToInputSchema } from "../upload";
import { richTextFieldToInputSchema } from "../richtext";
import { jsonFieldToInputSchema } from "../json";
import { isFieldConditionMet } from "../utils";

/**
 * Converts any field definition to its form input schema using zod.
 *
 * Dispatches to the field-type-specific input schema function based on `field.type`.
 * Used by the admin panel while form rendering to build the form input for individual fields, collections, blocks, and globals.
 *
 * When `data` is given, first checks `field`'s own `admin.condition` against
 * `(data, siblingData)` (Step 6's `isFieldConditionMet` — no condition, or a
 * throwing one, counts as met). A condition-false field short-circuits to
 * `z.unknown().optional()`: present in the schema (so its submitted value,
 * which the client keeps per the contract, still round-trips) but
 * completely unvalidated and allowed to be missing — Zod v4's bare
 * `z.unknown()` is itself non-optional (rejects an absent key with
 * `"expected nonoptional, received undefined"`), so a condition-hidden
 * field would otherwise still fail a required parent object's own parse —
 * `required` and any type/format check are skipped.
 * `data` reproduces today's behavior exactly: every field is built and
 * validated regardless of `admin.condition`.
 *
 * For a field that dispatches into `group`, `siblingData` for that field's
 * OWN sub-fields is this field's resolved value — `siblingData[key]`, where
 * `siblingData` is whatever object contains this field (`data` itself at
 * the top level) and `key` is this field's own key within it. `array`/
 * `blocks` items are positional, not keyed, so their per-item `siblingData`
 * is instead computed at validate time inside
 * `arrayFieldToInputSchema`/`blocksFieldToInputSchema`'s own `superRefine`,
 * directly from the value being parsed — `adminFieldToInputSchema` is still
 * the function that evaluates each of THEIR sub-fields' own conditions, just
 * called with `key: undefined` (the item's value needs no further indexing).
 *
 * @param props - Input props
 * @param props.field - The resolved field definition to convert
 * @param props.ignoreRequired - When true, this field — and, recursively,
 *   every sub-field a container type (`group`/`array`/`blocks`) dispatches
 *   back through this function — is built as if `required: false`, by
 *   overriding `field.required` before dispatch rather than duplicating
 *   per-type builder logic. A configured `min`/`max` still applies to a
 *   non-empty value exactly as it does for an optional field today; only the
 *   "must be present/non-empty" check `required` itself adds is skipped.
 *   Used by `getFieldsInputSchema`'s own `ignoreRequired` for draft saves
 *   (`prepareEdit`, `saveDraft` — a draft may omit required fields at any
 *   depth).
 * @param props.data - The full top-level document, unchanged through every
 *   level of recursion. Omit to skip condition evaluation entirely (today's
 *   behavior). Forwarded as-is to every nested field's own condition check
 *   and to `array`/`blocks`' per-item condition re-parse.
 * @param props.siblingData - The object containing `field`'s true siblings —
 *   `data` itself for a top-level field, a group's own resolved value for
 *   one of its sub-fields, an array/block item for one of ITS sub-fields.
 *   Missing/`undefined` falls back to `{}` so a condition referencing an
 *   absent sibling sees `undefined` rather than throwing.
 * @param props.key - `field`'s own key within `siblingData`, when known
 *   (top-level and group sub-field dispatch supply it; array/blocks item
 *   dispatch does not — an item's resolved value IS its own `siblingData`,
 *   with no extra key to index through). Used only to compute the
 *   `siblingData` this field's OWN sub-fields see, when it is itself a
 *   `group`.
 * @returns A ZodType (e.g. `z.string()`, `z.boolean().optional().default(false)`), or `z.unknown().optional()` when `data` is given and the field's condition is false
 * @throws An Error if an unrecognized field type is given. Reaching this is a
 * compile error: the default arm binds the exhausted union to `never`, so a new
 * member of `AdminField` fails typecheck here until a case is added
 *
 * @see {@link textFieldToInputSchema} for the text field implementation
 * @see {@link numberFieldToInputSchema} for the number field implementation
 * @see {@link checkboxFieldToInputSchema} for the checkbox field implementation
 * @internal
 */
export function adminFieldToInputSchema(props: {
  field: AdminDataField;
  ignoreRequired?: boolean;
  data?: Record<string, unknown>;
  siblingData?: Record<string, unknown>;
  key?: string;
}) {
  if (
    props.data !== undefined &&
    !isFieldConditionMet({
      field: props.field,
      data: props.data,
      siblingData: props.siblingData ?? {},
    })
  ) {
    return z.unknown().optional();
  }

  const effectiveField: AdminDataField = props.ignoreRequired
    ? { ...props.field, required: false }
    : props.field;
  // Captured before the switch narrows `effectiveField`: inside the default arm the
  // union is exhausted to `never`, and `never.type` is not a usable string.
  const fieldType: AdminFieldType = effectiveField.type;

  const childSiblingData: Record<string, unknown> | undefined =
    props.data === undefined
      ? undefined
      : props.key !== undefined
        ? (props.siblingData?.[props.key] as Record<string, unknown> | undefined)
        : props.siblingData;

  switch (effectiveField.type) {
    case ADMIN_FIELDS.text.type:
      return textFieldToInputSchema({ field: effectiveField });
    case ADMIN_FIELDS.email.type:
      return emailFieldToInputSchema({ field: effectiveField });
    case ADMIN_FIELDS.textarea.type:
      return textareaFieldToInputSchema({ field: effectiveField });
    case ADMIN_FIELDS.number.type:
      return numberFieldToInputSchema({ field: effectiveField });
    case ADMIN_FIELDS.checkbox.type:
      return checkboxFieldToInputSchema({ field: effectiveField });
    case ADMIN_FIELDS.date.type:
      return dateFieldToInputSchema({ field: effectiveField });
    case ADMIN_FIELDS.select.type:
      return selectFieldToInputSchema({ field: effectiveField });
    case ADMIN_FIELDS.url.type:
      return urlFieldToInputSchema({ field: effectiveField });
    case ADMIN_FIELDS.color.type:
      return colorFieldToInputSchema({ field: effectiveField });
    case ADMIN_FIELDS.relationship.type:
      return relationshipFieldToInputSchema({ field: effectiveField });
    case ADMIN_FIELDS.array.type:
      return arrayFieldToInputSchema({
        field: effectiveField,
        ignoreRequired: props.ignoreRequired,
        data: props.data,
      });
    case ADMIN_FIELDS.group.type:
      return groupFieldToInputSchema({
        field: effectiveField,
        ignoreRequired: props.ignoreRequired,
        data: props.data,
        siblingData: childSiblingData,
      });
    case ADMIN_FIELDS.blocks.type:
      return blocksFieldToInputSchema({
        field: effectiveField,
        ignoreRequired: props.ignoreRequired,
        data: props.data,
      });
    case ADMIN_FIELDS.upload.type:
      return uploadFieldToInputSchema({ field: effectiveField });
    case ADMIN_FIELDS.richtext.type:
      return richTextFieldToInputSchema({ field: effectiveField });
    case ADMIN_FIELDS.json.type:
      return jsonFieldToInputSchema({ field: effectiveField });
    default: {
      const unhandled: never = effectiveField;
      throw new Error(
        `unrecognized field type: ${fieldType} — ${JSON.stringify(unhandled)}`,
      );
    }
  }
}
