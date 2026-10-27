import { v, type Validator } from "convex/values";
import { VERSION_SYSTEM_FIELDS, VERSION_STATUSES, type VexVersionStatus } from "./constants";

const versionStatusKeys = Object.values(VERSION_STATUSES).map((status) => status.key);

/**
 * Convex validator for a version status, built from {@link VERSION_STATUSES} so adding a status
 * there is the only change runtime function args need.
 *
 * @example
 * ```ts
 * args: { status: v.optional(VERSION_STATUS_SCHEMA) }
 * ```
 */
export const VERSION_STATUS_SCHEMA = v.union(
  ...versionStatusKeys.map((key) => v.literal(key)),
) as unknown as Validator<VexVersionStatus>;

/**
 * Generated-schema source for {@link VERSION_STATUS_SCHEMA} — the same union as a code string,
 * for the schema generators that emit `vex.schema.ts` text rather than validator objects.
 *
 * @example
 * ```ts
 * `status: ${VERSION_STATUS_SCHEMA_SOURCE},` // status: v.union(v.literal("draft"), v.literal("published")),
 * ```
 */
export const VERSION_STATUS_SCHEMA_SOURCE = `v.union(${versionStatusKeys
  .map((key) => `v.literal("${key}")`)
  .join(", ")})`;

/**
 * The generated-schema source lines a versioned table needs: the three
 * `vex_*` system fields and the two indexes every draft-aware query reads
 * through (`by_status` for the published-only filter, `by_published` for
 * `findDraftRow`).
 *
 * Returns LINES rather than a finished table string because its two callers
 * build their tables differently — `collectionConfigToVexSchema`
 * (`collections/validator.ts`) accumulates `fieldsBlock`/`indexes` arrays
 * from a `CollectionConfig`, while `generateVexSchema` hand-writes the
 * `vex_globals` block as a literal line array (a global is not a
 * `CollectionConfig` and never passes through the former). Emitting lines
 * lets both splice into what they already have instead of re-parsing a
 * string one of them just produced.
 *
 * @param props - Input props.
 * @param props.tableName - The table these lines are emitted into. Also the
 *   target of the self-referential `vex_publishedId`: a draft row always
 *   points back at a published row in this SAME table, globals included
 *   (design-review §9 treats a global's draft as another `vex_globals` row).
 * @returns `fields` — object-literal member lines, tab-indented and
 *   comma-terminated to match the field lines around them; `indexes` —
 *   `.index(...)` chain lines, tab-indented to match the existing chain.
 *
 * Never checks `versions.drafts` itself — each caller owns that branch, since
 * each already holds the config and neither wants a no-op call on the common
 * non-versioned path.
 *
 * @example
 * ```ts
 * const { fields, indexes } = versionFieldsToVexSchema({ tableName: "posts" });
 * fieldsBlock.push(...fields);
 * collectionIndexes.push(...indexes);
 * ```
 */
export function versionFieldsToVexSchema(props: { tableName: string }): {
  fields: string[];
  indexes: string[];
} {
  return {
    fields: [
      // `vex_status` is optional, not defaulted: a row written before
      // `versions.drafts` was turned on has no value for it, and the
      // `backfillStatus` action — not the schema — is what stamps those.
      `\t${VERSION_SYSTEM_FIELDS.status.slug}: v.optional(${VERSION_STATUS_SCHEMA_SOURCE}),`,
      `\t${VERSION_SYSTEM_FIELDS.publishedAt.slug}: v.optional(v.number()),`,
      `\t${VERSION_SYSTEM_FIELDS.publishedId.slug}: v.optional(v.id("${props.tableName}")),`,
      `\t${VERSION_SYSTEM_FIELDS.activeVersion.slug}: v.optional(v.number()),`,
    ],
    indexes: [
      `\t.index("by_status", ["${VERSION_SYSTEM_FIELDS.status.slug}"])`,
      `\t.index("by_published", ["${VERSION_SYSTEM_FIELDS.publishedId.slug}"])`,
    ],
  };
}
