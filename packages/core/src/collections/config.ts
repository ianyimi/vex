import { AdminField, CollectionFieldMeta, ComponentHKT, number } from "../fields";
import { CollectionSlug } from "../types";
import { toTitleCase, plural } from "../utils";
import { ReservedCollectionFieldKey } from "./constants";
import { CollectionConfig, CollectionConfigInput } from "./types";
import { slugToPascalCase } from "./utils";

function populateCollectionFieldMeta<
  TFieldMeta extends {} = {},
  TCollectionMeta extends {} = {},
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  TFieldSlug extends string = string,
  TComponent extends ComponentHKT = ComponentHKT,
>({
  config,
}: {
  config: CollectionConfigInput<
    TFieldMeta,
    TCollectionMeta,
    TCollectionSlug,
    TFieldSlug,
    TComponent
  >;
}): Record<TFieldSlug, AdminField<TFieldMeta & CollectionFieldMeta>> {
  const fields: Record<
    TFieldSlug,
    AdminField<TFieldMeta & { collectionSlug: string }>
  > = {} as Record<TFieldSlug, AdminField<TFieldMeta & CollectionFieldMeta>>;
  Object.entries(config.fields).forEach((value) => {
    const fieldSlug = value[0] as TFieldSlug;
    const field = value[1] as AdminField<TFieldMeta & CollectionFieldMeta>;
    fields[fieldSlug] = {
      ...field,
      meta: {
        ...field?.meta,
        collectionSlug: config.slug,
      },
    };
  });
  return fields;
}

/**
 * Resolves a raw collection config input into a fully-populated `CollectionConfig`.
 *
 * Fills in any missing `labels` by deriving them from the `slug` — converting it
 * to title case for `singular` and further pluralising it for `plural`.
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
  TFieldSlug extends string = string,
  TComponent extends ComponentHKT = ComponentHKT,
>(
  // `string extends TFieldSlug` is the escape hatch for callers whose `fields`
  // is a widened `Record<string, AdminField<...>>` rather than an object
  // literal — `packages/better-auth/src/adapter.ts` builds it in a loop. Without
  // it, `string & "updatedAt"` collapses to `"updatedAt"` (not `never`), so the
  // auth adapter's own call would hit the reserved-key branch and fail to compile.
  config: string extends TFieldSlug
    ? CollectionConfigInput<TFieldMeta, TCollectionMeta, TCollectionSlug, TFieldSlug, TComponent>
    : [TFieldSlug & ReservedCollectionFieldKey] extends [never]
      ? CollectionConfigInput<TFieldMeta, TCollectionMeta, TCollectionSlug, TFieldSlug, TComponent>
      : {
          fields: {
            [K in TFieldSlug &
              ReservedCollectionFieldKey]: 'Field name is reserved — defineCollection injects "updatedAt" automatically; opt out with { timestamps: false }';
          };
        },
): CollectionConfig<
  TFieldMeta & CollectionFieldMeta,
  TCollectionMeta,
  TCollectionSlug,
  TFieldSlug,
  TComponent
> {
  const input = config as CollectionConfigInput<
    TFieldMeta,
    TCollectionMeta,
    TCollectionSlug,
    TFieldSlug,
    TComponent
  >;

  // Runtime guard for JS consumers — the compile-time branch above only
  // protects TypeScript callers whose `fields` is an object literal with
  // statically inferable literal keys. Mirrors `defineGlobal`'s guard.
  //
  // `meta.locked` is the discriminator, and it is load-bearing: an adapter may
  // legitimately declare a reserved key because the external system it mirrors
  // owns that column. `betterAuthAdapter` does exactly this — `updatedAt` is
  // never in its `EDITABLE_FIELDS`, so it always arrives locked. A
  // user-authored field is never locked, so it still throws.
  const reservedKeys: ReservedCollectionFieldKey[] = ["updatedAt"];
  for (const key of reservedKeys) {
    const declared = input.fields[key as TFieldSlug] as AdminField<TFieldMeta> | undefined;
    if (declared === undefined) {
      continue;
    }
    const meta: Record<string, unknown> = declared.meta;
    if (meta.locked === true) {
      continue;
    }
    throw new Error(
      `defineCollection: field key "${key}" is reserved and cannot be used in collection "${input.slug}". defineCollection injects it automatically; set { timestamps: false } to opt out.`,
    );
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
        updatedAt: number({
          admin: { position: "sidebar", readOnly: true },
          // `number()` defaults to `0`; an unsaved document has no update
          // time, and epoch is a lie. `getCollectionDefaultValues` yields
          // `undefined` on create and the stored value on edit.
          defaultValue: undefined,
          label: "Updated At",
          required: false,
        }) as AdminField<TFieldMeta>,
      };

  // Runs the injected field through the same `collectionSlug` meta-stamping as
  // every other field.
  const fields = populateCollectionFieldMeta({
    config: { ...input, fields: fieldsWithTimestamp },
  });
  return {
    interfaceName: slugToPascalCase({ slug: input.slug }) + "Document",
    ...input,
    fields,
    admin: {
      useAsTitle: "_id",
      ...input.admin,
      table: {
        defaultPageSize: 10,
        serverPageSize: 100,
        pageSizeOptions: [10, 25, 50, 100],
        defaultColumns: [],
        ...input.admin?.table,
        bulkActions: {
          delete: true,
          ...input.admin?.table?.bulkActions,
        },
        defaultSort: {
          field: "_createdAt",
          order: "desc",
          ...input.admin?.table?.defaultSort,
        },
      },
    },
    labels: {
      singular: toTitleCase(input.slug),
      plural: plural(toTitleCase(input.slug)),
      ...input.labels,
    },
    meta: {
      ...input.meta,
    } as TCollectionMeta,
  };
}
