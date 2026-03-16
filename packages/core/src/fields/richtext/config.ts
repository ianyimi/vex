import type { RichTextFieldDef } from "../../types";

/**
 * Creates a rich text field definition.
 * Stores Plate/Slate JSON document as `v.any()` in Convex.
 *
 * @param options.label - Display label in admin form
 * @param options.required - Whether this field is required
 * @param options.editor - Per-field editor adapter override
 * @returns A RichTextFieldDef
 *
 * @example
 * ```ts
 * content: richtext({ label: "Content", required: true })
 * ```
 */
export function richtext(options?: Omit<RichTextFieldDef, "type">): RichTextFieldDef {
  return {
    type: "richtext",
    ...options,
  };
}
