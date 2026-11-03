import { ADMIN_FIELDS } from "../constants";
import { BaseField, BaseFieldInput } from "../baseTypes";
import type { FieldAdminConfig, FieldAdminConfigInput } from "../baseTypes";
import type { VexResourceSlug } from "../../types/generated";

/** Which write events stamp a `commitTs()` field. @see {@link CommitTsFieldInput.on} */
export type CommitTsFieldOn = "publish" | "save" | "all";

/** How a `commitTs()` field's value is displayed in the admin form/table. */
export type CommitTsFieldAdminFormat = "relative" | "datetime" | "date";

/**
 * Admin UI configuration specific to `commitTs()` fields.
 *
 * @see {@link FieldAdminConfigInput} for the shared admin properties every field type gets
 */
export interface CommitTsFieldAdminInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
> extends FieldAdminConfigInput<TCollectionSlug> {
  /**
   * How the value is displayed.
   *
   * - `"relative"` — "3 minutes ago", with the exact `"datetime"`-formatted value in a tooltip.
   * - `"datetime"` — the date field's own formatter (`formatDateFieldValue`), with the relative
   *   time in a tooltip. **Default.**
   * - `"date"` — date-only, with the relative time in a tooltip.
   */
  format?: CommitTsFieldAdminFormat;
}

/**
 * Configuration input for a `commitTs()` field.
 *
 * `commitTs` fields store Convex's own commit-serialization clock value
 * (`ctx.db.vars.commitTs`, a nanosecond `Int64` resolved server-side at
 * commit) — never a client-supplied or app-computed timestamp. The field is
 * always read-only in the admin form and never appears in create/update
 * input validation; the ONLY way its value changes is by being written with
 * the `on`-policy's matching event, which `stampCommitTsFields`
 * (`db/documents.ts`) does automatically.
 *
 * **Defaults applied by `commitTs()`:**
 * ```ts
 * {
 *   type:   "commitTs",
 *   label:  "",      // inferred from the field key by defineCollection
 *   on:     "save",  // stamped on create/update/publish/unpublish, never on an autosave draft
 *   admin: {
 *     hidden:        false,
 *     readOnly:      true,    // always — never user-editable, regardless of input
 *     position:      "main",
 *     width:         "100%",
 *     cellAlignment: "left",
 *     enableSorting: true,    // always has an auto-index; sortable by default
 *     format:        "datetime",
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * import { commitTs, defineCollection } from '@vexcms/core'
 *
 * posts: defineCollection({
 *   fields: {
 *     // Stamped on create/update/publish/unpublish — not autosave drafts
 *     updatedAt: commitTs(),
 *
 *     // Stamped only when a version actually goes live
 *     publishedCommitTs: commitTs({ on: "publish", label: "Published At" }),
 *
 *     // Stamped on every write, including autosave drafts
 *     lastTouchedAt: commitTs({ on: "all", admin: { format: "relative" } }),
 *   }
 * })
 * ```
 *
 * @see {@link CommitTsField} for the resolved type after defaults are applied
 * @see {@link commitTs} for the config function that applies defaults
 * @see {@link BaseFieldInput} for shared properties (`label`, `description`, `index`)
 */
export interface CommitTsFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends {} = {},
> extends Omit<BaseFieldInput<TCollectionSlug, TFieldKey, TFieldMeta>, "required" | "defaultValue" | "admin"> {
  /** Which write events stamp this field. Default: `"save"`. @see {@link CommitTsFieldOn} */
  on?: CommitTsFieldOn;
  admin?: CommitTsFieldAdminInput<TCollectionSlug>;
}

/**
 * Resolved configuration for a `commitTs()` field, after all defaults are applied.
 *
 * @see {@link CommitTsFieldInput} for the user-facing input type
 * @see {@link commitTs} for the config function that produces this type
 */
export interface CommitTsField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
> extends Omit<BaseField<TCollectionSlug, TFieldMeta>, "required" | "defaultValue" | "admin"> {
  readonly type: typeof ADMIN_FIELDS.commitTs.type;
  label: string;
  /** Always `false` — a `commitTs` field is never required input; it is never input at all. */
  required: false;
  /**
   * `undefined` on a brand-new, not-yet-saved document (no stamp has
   * happened yet) — never an admin-settable default. Once stamped, holds
   * the resolved Unix-ms value (`find`/`get`/`search` convert Convex's
   * `bigint` ns before this is ever read); typed `number | undefined`
   * rather than the input type's bare `undefined` so every generic
   * consumer keyed off `TField["defaultValue"]` (`CellComponentProps`,
   * `ColumnDef`'s value type, …) sees the field's real stored-value type.
   */
  defaultValue: number | undefined;
  on: CommitTsFieldOn;
  /** Resolved admin config — the full {@link FieldAdminConfig} shape every data field carries, plus `format`. */
  admin: FieldAdminConfig<TCollectionSlug> & { format: CommitTsFieldAdminFormat };
}
