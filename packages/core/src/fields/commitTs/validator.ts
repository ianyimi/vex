import { ADMIN_FIELDS } from "../constants";
import type { CommitTsField } from "./types";

/**
 * Converts a `commitTs()` field definition to a Convex schema validator.
 *
 * Always `"v.optional(v.commitTs())"` — a `commitTs` field is never
 * `required` (there is no admin-form input to require), and a document
 * written before the field existed, or before its `on` event has ever
 * fired, legitimately has no value yet.
 *
 * @param props - Input props.
 * @param props.field - The `commitTs` field definition (ignored beyond its
 *   type — kept for the same per-type dispatch signature every other
 *   `*FieldToValidator` function has).
 * @returns `"v.optional(v.commitTs())"`.
 *
 * @example
 * ```ts
 * const field = commitTs()
 * commitTsFieldToValidator({ field })  // "v.optional(v.commitTs())"
 * ```
 *
 * @internal - Used by schema generation, not typically called by users
 */
export function commitTsFieldToValidator(props: { field: CommitTsField }): string {
  void props.field;
  return `v.optional(${ADMIN_FIELDS.commitTs.validator})`;
}
