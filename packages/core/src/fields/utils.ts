import { ConvexError, type Value } from "convex/values";
import { z, type ZodType } from "zod";
import { AdminField } from "./types";
import { adminFieldToInputSchema } from "./inputSchemas";
import { createVexCallbackApi, type VexCallbackApi } from "../api/server";
import type { VexConfig } from "../config";
import type { TDocument } from "../api/convex";
import type { VexMutationCtx } from "../types/generated";

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
export function adminFieldToJSDocComment(props: { field: AdminField }): string {
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
}) {
  const res: Record<string, ZodType> = {};
  for (const [fieldKey, fieldDef] of Object.entries(props.fields)) {
    if (fieldDef.admin.hidden) continue;
    res[fieldKey] = adminFieldToInputSchema({
      field: fieldDef,
      ignoreRequired: props.ignoreRequired,
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
  for (const [fieldKey, fieldDef] of Object.entries(props.fields)) {
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
  const byType = Object.entries(props.fields).reduce<Record<string, string[]>>(
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
 * `create`) or that don't define `validate`.
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
  for (const [fieldKey, field] of Object.entries(props.fields)) {
    if (!keys.has(fieldKey) || !field.validate) continue;
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
function toFieldValidationError(props: {
  thrown: unknown;
  fieldKey: string;
}): ConvexError<Value> {
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
