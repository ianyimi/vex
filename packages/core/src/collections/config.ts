import pluralize from "pluralize-esm";

import { AdminField, CollectionFieldMeta, commitTs, getDataFields } from "../fields";
import { ComponentHKT, resolveComponentContributions, SLOT_IDS } from "../components";
import { CollectionSlug } from "../types";
import { toTitleCase } from "../utils";
import { COLLECTION_SYSTEM_FIELDS, CollectionSystemField } from "./constants";
import {
  AdminCollectionConfig,
  CollectionConfig,
  CollectionConfigInput,
  type CollectionDataFieldSlug,
} from "./types";
import type { CollectionHooks } from "./hooks";
import { slugToPascalCase } from "./utils";
import { resolveCollectionIndexes } from "./resolveCollectionIndexes";
import { validateSavedListViewConfig } from "./savedListViews/validateSavedListViewConfig";
import {
  DEFAULT_AUTOSAVE_DEBOUNCE_MS,
  VERSION_STATUSES,
  VERSION_SYSTEM_FIELDS,
  type VersionSystemField,
} from "../versions";

/** The list page-size picker's choices when a collection declares no `pageSizeOptions`. */
const defaultPageSizeOptions = [10, 25, 50, 100];

function populateCollectionFieldMeta<
  TFieldMeta extends {} = {},
  TCollectionMeta extends {} = {},
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  TFields extends Record<string, AdminField<TFieldMeta>> = Record<string, AdminField<TFieldMeta>>,
  TComponent extends ComponentHKT = ComponentHKT,
  TDrafts extends boolean = boolean,
  TTimestamps extends boolean = boolean,
>({
  config,
}: {
  config: CollectionConfigInput<
    TFieldMeta,
    TCollectionMeta,
    TCollectionSlug,
    TFields,
    TComponent,
    TDrafts,
    TTimestamps
  >;
}): Record<string, AdminField<TFieldMeta & CollectionFieldMeta>> {
  const fields: Record<string, AdminField<TFieldMeta & { collectionSlug: string }>> = {};
  Object.entries(config.fields).forEach(([fieldSlug, field]) => {
    const typedField = field as AdminField<TFieldMeta & CollectionFieldMeta>;
    fields[fieldSlug] = {
      ...typedField,
      admin: {
        enableSorting: false,
        enableHiding: true,
        ...typedField.admin,
      },
      meta: {
        ...typedField?.meta,
        collectionSlug: config.slug,
      },
    } as AdminField<TFieldMeta & CollectionFieldMeta>;
  });
  return fields;
}

/**
 * Resolves a raw collection config input into a fully-populated `CollectionConfig`.
 *
 * Fills in any missing `labels` by deriving them from the `slug` — singularizing
 * then title-casing it for `singular`, and title-casing the slug itself for
 * `plural` (slugs are plural by convention).
 *
 * @param config - The raw collection configuration supplied by the caller.
 * @returns The resolved `CollectionConfig` with all defaults applied.
 *
 * @example
 * ```ts
 * defineCollection({
 *   slug: "posts",
 *   fields: {
 *     title: text({ required: true }),
 *   },
 * });
 * // → { slug: "posts", admin: { useAsTitle: "_id" }, labels: { singular: "Post", plural: "Posts" }, fields: { ... } }
 * ```
 *
 * @see {@link CollectionConfigInput} for the user-facing input type
 * @see {@link CollectionConfig} for the resolved return type
 */
export function defineCollection<
  TFieldMeta extends {} = {},
  TCollectionMeta extends {} = {},
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  TFields extends Record<string, AdminField<TFieldMeta>> = Record<string, AdminField<TFieldMeta>>,
  TComponent extends ComponentHKT = ComponentHKT,
  const TDrafts extends boolean = false,
  const TTimestamps extends boolean = true,
>(
  // `string extends keyof TFields` is the escape hatch for callers whose `fields`
  // is a widened `Record<string, AdminField<...>>` rather than an object
  // literal — `packages/better-auth/src/adapter.ts` builds it in a loop. Without
  // it, `string & "updatedAt"` collapses to `"updatedAt"` (not `never`), so the
  // auth adapter's own call would hit the reserved-key branch and fail to compile.
  config: string extends keyof TFields
    ? CollectionConfigInput<TFieldMeta, TCollectionMeta, TCollectionSlug, TFields, TComponent, TDrafts, TTimestamps>
    : [keyof TFields & (CollectionSystemField | VersionSystemField)] extends [never]
      ? CollectionConfigInput<TFieldMeta, TCollectionMeta, TCollectionSlug, TFields, TComponent, TDrafts, TTimestamps>
      : {
          fields: {
            [K in keyof TFields & (CollectionSystemField | VersionSystemField)]: 'Field name is reserved — defineCollection injects "updatedAt" automatically; opt out with { timestamps: false }';
          };
        },
): CollectionConfig<
  TFieldMeta & CollectionFieldMeta,
  TCollectionMeta,
  TCollectionSlug,
  TFields,
  TComponent,
  TDrafts,
  TTimestamps,
  CollectionDataFieldSlug<TFields, TTimestamps>
> {
  const input = config as CollectionConfigInput<
    TFieldMeta,
    TCollectionMeta,
    TCollectionSlug,
    TFields,
    TComponent,
    TDrafts,
    TTimestamps
  >;

  // Runtime guard for JS consumers — reserved keys are rejected on the RAW
  // authored fields record, before any flattening, so a `ui()`/`tabs()`
  // entry literally named "updatedAt" is rejected the same as a data field.
  // Mirrors `defineGlobal`'s guard. `meta.locked` is the discriminator, and
  // it is load-bearing: an adapter may legitimately declare a reserved key
  // because the external system it mirrors owns that column. `betterAuthAdapter`
  // does exactly this — `updatedAt` is never in its `EDITABLE_FIELDS`, so it
  // always arrives locked. A user-authored field of that name never reaches
  // this branch; the guard above protects a literal config object, this
  // protects a dynamically-assembled one.
  const reservedKeys: (CollectionSystemField | VersionSystemField)[] = [
    ...Object.values(COLLECTION_SYSTEM_FIELDS),
    ...Object.values(VERSION_SYSTEM_FIELDS),
  ].map((field) => field.slug);
  for (const key of reservedKeys) {
    const declared = (input.fields as Record<string, AdminField<TFieldMeta>>)[key];
    if (declared === undefined) continue;
    const meta: Record<string, unknown> = declared.meta;
    if (meta.locked === true) continue;
    throw new Error(
      `defineCollection: field key "${key}" is reserved and cannot be used in collection "${input.slug}". defineCollection injects it automatically; set { timestamps: false } to opt out.`,
    );
  }

  // Reject a duplicate key once the fields record is flattened to data
  // fields — two fields named the same, a named tab reusing a sibling's
  // key, two tabs sharing a `name`. `getDataFields` itself throws; called
  // here purely for the side effect, result discarded.
  getDataFields({ fields: input.fields });

  // Runtime guard: `draftStatus` (collection-level `indexes[]` and
  // field-level `index.draftStatus`) requires `versions.drafts: true`. The
  // type-level `TDrafts extends true ? ... : never` branch on
  // `CollectionConfigInput.indexes[].draftStatus` only protects a literal
  // config object — a JS caller, or a dynamically-assembled `indexes`
  // array, bypasses it the same way the reserved-key guard above needs its
  // own runtime half.
  if (input.versions?.drafts !== true) {
    const indexOffender = input.indexes?.find((i) => i.draftStatus !== undefined);
    if (indexOffender) {
      throw new Error(
        `defineCollection: index "${indexOffender.name}" on collection "${input.slug}" declares draftStatus but versions.drafts is not true.`,
      );
    }
    const fieldOffender = Object.entries(getDataFields({ fields: input.fields })).find(
      ([, field]) => typeof field.index === "object" && field.index.draftStatus !== undefined,
    );
    if (fieldOffender) {
      throw new Error(
        `defineCollection: field "${fieldOffender[0]}" on collection "${input.slug}" declares index.draftStatus but versions.drafts is not true.`,
      );
    }
  }

  // Never mutate `input.fields`: the same input object may be reused across
  // several `defineCollection` calls.
  //
  // Three reasons not to inject, all about ownership:
  // - `timestamps: false` — the project opted out explicitly.
  // - `"updatedAt" in input.fields` — already declared. This is how
  //   better-auth's OWN `updatedAt` survives: its adapter populates the key
  //   from the auth table's real schema attribute (always `meta.locked`)
  //   before calling here, so injecting over it would clobber a field the
  //   external system dictates. A user-authored field of that name never
  //   reaches this branch; both guards above reject it first.
  // - `meta.protected` — the whole collection is auth-adapter-owned (every
  //   auth table except `user`). vexcms's `create`/`update` never write those
  //   rows, so injecting a column here would emit `updatedAt?: number` into
  //   the schema and generated types for a value nothing ever populates.
  //   `jwks` is the case that proves it: better-auth declares no `updatedAt`
  //   of its own there, so the `in` check above does not catch it.
  const meta: Record<string, unknown> = input.meta ?? {};
  const skipInjection =
    input.timestamps === false || "updatedAt" in input.fields || meta.protected === true;
  const fieldsWithTimestamp = skipInjection
    ? input.fields
    : {
        ...input.fields,
        updatedAt: commitTs({
          label: "Updated At",
          on: "save",
          admin: { position: "sidebar" },
        }) as AdminField<TFieldMeta>,
      };

  // Index declarations are checked here, at definition time, against the
  // fields record the collection actually stores — including the injected
  // `updatedAt`, so `additionalFields: ["updatedAt"]` resolves. The result is
  // recomputed where it is used.
  resolveCollectionIndexes({ collection: { ...input, fields: fieldsWithTimestamp } });

  // Runs the injected field through the same `collectionSlug` meta-stamping as
  // every other field, and defaults enableSorting/enableHiding.
  const fields = populateCollectionFieldMeta({
    config: { ...input, fields: fieldsWithTimestamp },
  });

  // `view.columns` falls back to every non-hidden data field, in field
  // declaration order, when the project doesn't specify one — new home under
  // `admin.view`.
  const defaultViewColumns =
    input.admin?.view?.columns ??
    Object.entries(getDataFields({ fields: fieldsWithTimestamp }))
      .filter(([, field]) => field.admin?.hidden !== true)
      .map(([fieldKey]) => fieldKey);

  // Without explicit `pageSizeOptions`, the defaults plus a custom `pageSize`, sorted —
  // so `pageSize: 20` offers 10/20/25/50/100 and the picker can select it. Explicit
  // options (including `[]`, which hides the picker) are used exactly as given.
  const pageSizeOptions =
    input.admin?.view?.pageSizeOptions ??
    [...new Set([...defaultPageSizeOptions, input.admin?.view?.pageSize ?? 10])].sort(
      (a, b) => a - b,
    );

  const collection = {
    interfaceName: slugToPascalCase({ slug: input.slug }) + "Document",
    ...input,
    // `populateCollectionFieldMeta`'s return widens to `Record<string, AdminField<...>>`;
    // `TFields` is the caller's literal fields-record type, structurally unrelated
    // to that widened shape from TS's point of view even though the runtime value
    // is exactly `TFields` plus the `collectionSlug` meta stamp.
    fields: fields as unknown as Partial<
      Record<CollectionSystemField, AdminField<TFieldMeta & CollectionFieldMeta>>
    > &
      TFields,
    hooks: (input.hooks ?? {}) as CollectionHooks<TCollectionSlug>,
    admin: {
      useAsTitle: "_id",
      ...input.admin,
      // `admin.table` is gone entirely — every
      // collection-wide list setting that used to live there now resolves
      // as part of `admin.view` itself (the same object the per-view
      // query-state defaults below resolve into), and falls back to
      // `admin.views[n]` below it, one level deeper, before the global
      // default here.
      view: {
        viewId: "default",
        name: input.admin?.view?.name ?? "All",
        description: input.admin?.view?.description,
        state: {
          where: input.admin?.view?.where,
          sort: {
            field: "_creationTime",
            order: "desc",
            ...input.admin?.view?.sort,
          },
          columns: defaultViewColumns,
          pageSize: input.admin?.view?.pageSize ?? 10,
          searchField: input.admin?.view?.searchField ?? input.admin?.view?.searchFields?.[0],
          searchFields: input.admin?.view?.searchFields ?? [],
          pageSizeOptions,
          // Caps the first-page total-count scan.
          countLimit: input.admin?.view?.countLimit ?? 10000,
          serverPageSize: input.admin?.view?.serverPageSize ?? 100,
          bulkActions: {
            delete: true,
            ...input.admin?.view?.bulkActions,
          },
        },
      },
      // `admin.views` entries accept the
      // same settings as `admin.view`: every `admin.views[n]`'s own
      // collection-wide keys (`searchFields`/`pageSizeOptions`/
      // `countLimit`/`serverPageSize`/`bulkActions`), when unset, fall back
      // to `admin.view`'s own just-resolved value — the same two-tier
      // fallback `admin.view` itself already uses against the global
      // default above, one level deeper. The per-view query state
      // (`where`/`sort`/`search`/`searchField`/`columns`/`pageSize`) stays
      // exactly as declared, unresolved here — `resolveListViewQueryState`'s
      // own existing three-tier chain (URL → active view → `admin.view`)
      // already handles THAT fallback lazily, at query time. Supersedes
      // the old `admin.table.views` (clean cutover).
      views: (input.admin?.views ?? []).map((view) => ({
        ...view,
        state: {
          ...view.state,
          searchFields: view.state.searchFields ?? input.admin?.view?.searchFields ?? [],
          pageSizeOptions: view.state.pageSizeOptions ?? pageSizeOptions,
          countLimit: view.state.countLimit ?? input.admin?.view?.countLimit ?? 10000,
          serverPageSize: view.state.serverPageSize ?? input.admin?.view?.serverPageSize ?? 100,
          bulkActions: {
            delete: true,
            ...input.admin?.view?.bulkActions,
            ...view.state.bulkActions,
          },
        },
      })),
      // One boundary cast: `CollectionConfigInput` widens `TCollectionSlug` to
      // `string`, so its resolver's doc type is the conditional form TS cannot
      // reduce against `CollectionConfig`'s already-narrowed parameter. Same
      // shape either way — mirrors `globals/config.ts`.
      // Passed through untouched, NOT defaulted: this factory runs before
      // `defineConfig` has seen `livePreview.collections[slug]`, so a default
      // applied here would be indistinguishable from an explicit value and would
      // outrank the root entry. `resolveLivePreviewSettings` owns every default.
      livePreview: input.admin?.livePreview as AdminCollectionConfig<
        string,
        ComponentHKT,
        TCollectionSlug
      >["livePreview"],
      // The seven `list.*` slots are flat
      // and additive with no override chains, so each one resolves here exactly like the root
      // project-wide `admin.components.blocks`/`array` lists (`config/config.ts`) — order/before/
      // after/hide directives applied now, built-ins merged in later by `SlotOutlet` at render
      // time. `edit` passes through via the `...input.admin?.components` spread, untouched.
      components: {
        ...input.admin?.components,
        headerActions: resolveComponentContributions({
          slotId: SLOT_IDS.list.headerActions,
          contributions: input.admin?.components?.headerActions ?? [],
        }),
        toolbar: resolveComponentContributions({
          slotId: SLOT_IDS.list.toolbar,
          contributions: input.admin?.components?.toolbar ?? [],
        }),
        filters: resolveComponentContributions({
          slotId: SLOT_IDS.list.filters,
          contributions: input.admin?.components?.filters ?? [],
        }),
        beforeTable: resolveComponentContributions({
          slotId: SLOT_IDS.list.beforeTable,
          contributions: input.admin?.components?.beforeTable ?? [],
        }),
        afterTable: resolveComponentContributions({
          slotId: SLOT_IDS.list.afterTable,
          contributions: input.admin?.components?.afterTable ?? [],
        }),
        rowActions: resolveComponentContributions({
          slotId: SLOT_IDS.list.rowActions,
          contributions: input.admin?.components?.rowActions ?? [],
        }),
        bulkActions: resolveComponentContributions({
          slotId: SLOT_IDS.list.bulkActions,
          contributions: input.admin?.components?.bulkActions ?? [],
        }),
      },
    },
    labels: {
      singular: toTitleCase(pluralize.singular(input.slug)),
      plural: toTitleCase(input.slug),
      ...input.labels,
    },
    meta: {
      ...input.meta,
    } as TCollectionMeta,
    versions: {
      drafts: false as TDrafts,
      cascadeDelete: true,
      defaultStatus: VERSION_STATUSES.draft.key,
      ...input.versions,
      autosave: {
        enabled: false,
        debounceMs: DEFAULT_AUTOSAVE_DEBOUNCE_MS,
        ...input.versions?.autosave,
      },
    },
  } as CollectionConfig<
    TFieldMeta & CollectionFieldMeta,
    TCollectionMeta,
    TCollectionSlug,
    TFields,
    TComponent,
    TDrafts,
    TTimestamps,
    CollectionDataFieldSlug<TFields, TTimestamps>
  >;

  // Config-time guard: a `searchField` entry with no
  // `searchIndex`, or a sortable field with no leading index, is a project
  // bug caught here rather than surfacing as a broken control in the browser.
  // Every per-view check — unique `viewId` (including the
  // reserved `"default"`), `where`/sort/searchField/columns — also runs here,
  // inside `validateSavedListViewConfig`, over
  validateSavedListViewConfig({ collection });

  return collection;
}
