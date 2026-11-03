import { ADMIN_FIELDS } from "../constants";
import { BaseFieldMeta } from "../types";
import { resolveFieldComponents } from "../utils";
import type { VexResourceSlug } from "../../types/generated";
import type { CommitTsFieldInput, CommitTsField } from "./types";

/**
 * Creates a `commitTs()` field with all defaults applied.
 *
 * `commitTs` fields store Convex's own commit-serialization clock value
 * (`ctx.db.vars.commitTs`) — a database-stamped Unix-nanosecond timestamp,
 * never a client-supplied value. Always read-only; stamped automatically by
 * `stampCommitTsFields` on the write events named by `on`.
 *
 * Accepts {@link CommitTsFieldInput} (all optional) and returns {@link CommitTsField} with all defaults applied.
 *
 * **Defaults applied:**
 * - `label` — `""` (inferred from the field key by `defineCollection`)
 * - `on` — `"save"`
 * - `admin.hidden` — `false`
 * - `admin.readOnly` — always `true`
 * - `admin.position` — `"main"`
 * - `admin.width` — `"100%"`
 * - `admin.cellAlignment` — `"left"`
 * - `admin.enableSorting` — `true` (always has an auto-index, per `resolveCollectionIndexes`)
 * - `admin.format` — `"datetime"`
 *
 * @param options - `commitTs` field configuration. All properties are optional.
 * @returns Resolved `commitTs` field definition with all defaults applied.
 *
 * @example
 * ```ts
 * import { commitTs, defineCollection } from '@vexcms/core'
 *
 * posts: defineCollection({
 *   fields: {
 *     updatedAt: commitTs(),
 *     publishedCommitTs: commitTs({ on: "publish" }),
 *   }
 * })
 * ```
 *
 * @see {@link CommitTsFieldInput} for the full input type
 * @see {@link CommitTsField} for the resolved output type
 */
export function commitTs<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
>(
  options?: CommitTsFieldInput<TCollectionSlug, TFieldKey, TFieldMeta>,
): CommitTsField<TCollectionSlug, TFieldMeta> {
  return {
    type: ADMIN_FIELDS.commitTs.type,
    interfaceType: ADMIN_FIELDS.commitTs.interfaceType,

    label: "",
    required: false,
    defaultValue: undefined,
    on: options?.on ?? "save",
    ...options,

    admin: {
      hidden: false,
      position: "main",
      width: "100%",
      cellAlignment: "left",
      enableSorting: true,
      enableHiding: false,
      format: "datetime",
      // Optional admin properties (no defaults)
      ...options?.admin,
      // Always read-only, regardless of what the caller passed — the whole
      // point of this field type is that app code never writes its value.
      readOnly: true,
      components: resolveFieldComponents({ components: options?.admin?.components }),
    },
    meta: {
      ...options?.meta,
    } as TFieldMeta,
  } as CommitTsField<TCollectionSlug, TFieldMeta>;
}
