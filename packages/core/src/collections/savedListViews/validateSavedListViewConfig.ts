import { getDataFields } from "../../fields";
import { CollectionConfig, columnEntryField } from "../types";
import { resolveCollectionIndexes } from "../resolveCollectionIndexes";
import type { VexWhereNodeOf } from "../../access/queryConstraintTypes";
import { VERSION_SYSTEM_FIELDS } from "../../versions";
import { VexConfigError } from "../../errors";

/**
 * Collects every field name a {@link VexWhereNodeOf} tree constrains on,
 * walking `and`/`or`/`not` recursively. Used by `validateSavedListViewConfig`'s
 * where-field check — a view's `where` is `VexWhereNodeOf<unknown>`
 * (portable, collection-structure-agnostic), so field
 * names are only checkable against the real collection here, not by
 * `TFieldSlug`.
 *
 * @param node - The where tree, or a branch of it during recursion.
 * @param out - Accumulator every discovered field name is added to.
 */
function collectWhereFields(node: VexWhereNodeOf<unknown>, out: Set<string>): void {
  if ("and" in node) {
    for (const child of node.and) collectWhereFields(child, out);
    return;
  }
  if ("or" in node) {
    for (const child of node.or) collectWhereFields(child, out);
    return;
  }
  if ("not" in node) {
    collectWhereFields(node.not, out);
    return;
  }
  out.add(node.field);
}

/**
 * The internal `ColumnDef.id` `DataTable` reserves for the always-first,
 * always-left-pinned selection checkbox column (`ui/data-table/DataTable.tsx`).
 * A `ColumnEntry.field` naming it would collide with that reserved slot —
 * checked below, same as any other unknown-field rejection, but with its
 * own message since the collision isn't "unknown," it's "reserved."
 */
const SELECTION_COLUMN_ID = "select";

/**
 * Validates a collection's `admin.view`/`admin.views` surface against its
 * fields and declared indexes. Every check runs over
 * `[collection.admin.view, ...collection.admin.views]` uniformly — both
 * share the same `VexViewState` shape, and `defineCollection` has already
 * resolved each `admin.views[n]`'s own collection-wide keys
 * (`searchFields`/`pageSizeOptions`/`countLimit`/`serverPageSize`/`bulkActions`)
 * against `admin.view`'s own value by the time this runs, so reading
 * `view.state.X` below is always that view's OWN effective value,
 * whichever tier it actually came from.
 *
 * Checks, per view:
 * 1. Every `state.searchFields` entry names a field that declares its own
 *    `searchIndex` (`"searchIndex" in field && field.searchIndex`) → else
 *    throws naming the view, the field, and the `searchIndex` to add.
 * 2. Every field with `admin.enableSorting: true` leads some index resolved
 *    by `resolveCollectionIndexes` (`index.fields[0] === fieldKey`) → else
 *    throws naming the field and the index to declare (collection-wide,
 *    runs once, unchanged from before this step).
 * 3. Every entry in `[admin.view, ...admin.views]` has a unique `viewId` →
 *    else throws naming the duplicate id. `admin.view.viewId` is always
 *    `"default"`, so a preset view that also declares `"default"` is
 *    caught by this same check — the id is reserved without a separate
 *    special case.
 * 4. Every one of those entries' `state.where`, when set, only names
 *    fields that exist on the collection — plus the system fields
 *    `"_creationTime"` and, when `versions.drafts` is `true`, `"vex_status"`
 *    — walked recursively through `and`/`or`/`not` → else throws naming the
 *    view and the unknown field.
 * 5. Every one of those entries' `state.sort.field`, when set and not
 *    `"_creationTime"`, leads some index — the same rule as #2, applied per
 *    view → else throws naming the view, field, and index to declare.
 * 6. Every one of those entries' `state.searchField`, when set, is one of
 *    THAT SAME view's own resolved `state.searchFields` → else throws
 *    naming the view and the declared entries.
 * 7. Every one of those entries' `state.columns`, when set: each entry's
 *    field (`columnEntryField`, whichever of the two `ColumnEntry` shapes
 *    it is) must name a known field, and must not name the reserved
 *    selection-column id → else throws naming the view and the offending
 *    column. An object-shaped entry setting `enableSorting: true` must
 *    lead a declared index — the SAME check #2 already runs for
 *    `field.admin.enableSorting: true`, now also applied to a view-level
 *    override, naming the offending view.
 *
 * @param props - Input props.
 * @param props.collection - The resolved collection (after `defineCollection`'s
 *   defaults are applied, before it is returned to the caller).
 * @throws {VexConfigError} On any check above.
 */
export function validateSavedListViewConfig(props: { collection: CollectionConfig }): void {
  const { collection } = props;
  const at = `defineCollection: collection "${collection.slug}"`;
  const dataFields = getDataFields({ fields: collection.fields });
  const indexes = resolveCollectionIndexes({ collection });

  const sortableFields = new Set<string>(
    Object.entries(dataFields)
      .filter(([, field]) => field.admin?.enableSorting === true)
      .map(([fieldKey]) => fieldKey),
  );

  for (const fieldKey of sortableFields) {
    if (!indexes.some((index) => index.fields[0] === fieldKey)) {
      throw new VexConfigError(
        `${at}: field "${fieldKey}" is sortable (admin.enableSorting) but leads no declared ` +
          `index. Add index: "by_${fieldKey}" to the "${fieldKey}" field, or a collection-level ` +
          `indexes entry starting with "${fieldKey}".`,
      );
    }
  }

  const allViews = [collection.admin.view, ...collection.admin.views];
  const viewIds = new Set<string>();
  for (const view of allViews) {
    if (viewIds.has(view.viewId)) {
      throw new VexConfigError(
        `${at}: more than one view has viewId "${view.viewId}". View ids must be unique ` +
          `within a collection (the default view's id "default" is reserved — an ` +
          `admin.views entry can't reuse it).`,
      );
    }
    viewIds.add(view.viewId);

    for (const fieldKey of view.state.searchFields ?? []) {
      const field = dataFields[fieldKey];
      const hasSearchIndex = field !== undefined && "searchIndex" in field && field.searchIndex !== undefined;
      if (!hasSearchIndex) {
        throw new VexConfigError(
          `${at}: view "${view.viewId}" declares searchFields naming "${fieldKey}", which has no ` +
            `searchIndex. Add searchIndex: { name: "search_${fieldKey}", filterFields: [] } to the ` +
            `"${fieldKey}" field.`,
        );
      }
    }

    if (view.state.where !== undefined) {
      const whereFields = new Set<string>();
      collectWhereFields(view.state.where, whereFields);
      for (const fieldKey of whereFields) {
        const isSystemField =
          fieldKey === "_creationTime" ||
          (collection.versions.drafts && fieldKey === VERSION_SYSTEM_FIELDS.status.slug);
        if (!isSystemField && dataFields[fieldKey] === undefined) {
          throw new VexConfigError(
            `${at}: view "${view.viewId}" has a where clause naming unknown field "${fieldKey}". ` +
              `Views can only filter on this collection's own fields` +
              `${collection.versions.drafts ? ', "_creationTime", or "vex_status"' : ' or "_creationTime"'}.`,
          );
        }
      }
    }

    const viewSortField = view.state.sort?.field;
    if (
      viewSortField !== undefined &&
      viewSortField !== "_creationTime" &&
      !indexes.some((index) => index.fields[0] === viewSortField)
    ) {
      throw new VexConfigError(
        `${at}: view "${view.viewId}" sorts by field "${viewSortField}", which leads no ` +
          `declared index. Add index: "by_${viewSortField}" to the "${viewSortField}" field, or a ` +
          `collection-level indexes entry starting with "${viewSortField}".`,
      );
    }

    const viewSearchField = view.state.searchField;
    if (viewSearchField !== undefined && !(view.state.searchFields ?? []).includes(viewSearchField)) {
      const declared = view.state.searchFields ?? [];
      throw new VexConfigError(
        `${at}: view "${view.viewId}" searches field "${viewSearchField}", which is not one ` +
          `of this view's own declared searchFields (${
            declared.length > 0 ? declared.map((field) => `"${field}"`).join(", ") : "none declared"
          }).`,
      );
    }

    for (const entry of view.state.columns ?? []) {
      const columnKey = columnEntryField(entry);
      if (columnKey === SELECTION_COLUMN_ID) {
        throw new VexConfigError(
          `${at}: view "${view.viewId}" has a column entry naming "${SELECTION_COLUMN_ID}", which is ` +
            `reserved for the always-first, always-left-pinned selection checkbox column.`,
        );
      }
      if (dataFields[columnKey] === undefined) {
        throw new VexConfigError(
          `${at}: view "${view.viewId}" has an unknown column "${columnKey}". Columns must ` +
            `name one of this collection's own fields.`,
        );
      }
      if (typeof entry !== "string" && entry.enableSorting === true) {
        if (!indexes.some((index) => index.fields[0] === columnKey)) {
          throw new VexConfigError(
            `${at}: view "${view.viewId}" sets enableSorting: true on column "${columnKey}", but it ` +
              `leads no declared index. Add index: "by_${columnKey}" to the "${columnKey}" field, or a ` +
              `collection-level indexes entry starting with "${columnKey}".`,
          );
        }
      }
    }
  }
}
