import { describe, expect, expectTypeOf, it } from "vitest";
import { defineCollection, text } from "../index";
import type { CollectionDataFieldSlug } from "./types";

/**
 * Compile-time regression pins for the auto-injected `updatedAt` `commitTs`
 * field's type-level visibility: `DataFieldSlug<TFields>` is computed purely
 * from the literal `fields` object a `defineCollection()` call is given, so
 * it never included `"updatedAt"` — `defineCollection` injects that field
 * at RUNTIME (`collections/config.ts`'s `fieldsWithTimestamp`), with no way
 * for `DataFieldSlug` alone to see it. `CollectionDataFieldSlug<TFields,
 * TTimestamps>` adds `"updatedAt"` back wherever a collection's own data
 * field slugs are accepted (`admin.view.sort`/`columns`,
 * `admin.views[].state.columns`, `indexes[].fields`), UNLESS the collection
 * opts out with `timestamps: false`.
 *
 * `vitest` type-checks this file through `tsc --noEmit` (the package's own
 * `typecheck` script); the runtime bodies assert nothing beyond calling the
 * real `defineCollection`/`expectTypeOf`. Written as real `defineCollection`
 * calls (not just isolated `CollectionDataFieldSlug` assertions) because the
 * generic only engages through the real inference site — `defineCollection`
 * threading `TTimestamps` through to `CollectionConfigInput`/
 * `AdminCollectionConfigInput` — the same reasoning
 * `fieldPermissions.types.test.ts` documents for field maps.
 */
describe("defineCollection — injected updatedAt field slug typing", () => {
  it("accepts 'updatedAt' as admin.view.sort.field by default (timestamps omitted)", () => {
    defineCollection({
      slug: "posts",
      fields: { title: text() },
      admin: { view: { sort: { field: "updatedAt", order: "desc" } } },
    });
  });

  it("accepts 'updatedAt' as admin.view.sort.field when timestamps: true is explicit", () => {
    defineCollection({
      slug: "posts",
      fields: { title: text() },
      timestamps: true,
      admin: { view: { sort: { field: "updatedAt", order: "desc" } } },
    });
  });

  it("accepts 'updatedAt' in admin.view.columns", () => {
    defineCollection({
      slug: "posts",
      fields: { title: text() },
      admin: { view: { columns: ["title", "updatedAt"] } },
    });
  });

  it("accepts 'updatedAt' in admin.views[].state.columns", () => {
    defineCollection({
      slug: "posts",
      fields: { title: text() },
      admin: {
        views: [
          { viewId: "recent", name: "Recent", state: { columns: ["title", "updatedAt"] } },
        ],
      },
    });
  });

  it("accepts 'updatedAt' in a collection-level indexes[].fields entry", () => {
    defineCollection({
      slug: "posts",
      fields: { title: text() },
      indexes: [{ name: "by_updated_title", fields: ["updatedAt", "title"] }],
    });
  });

  it("rejects 'updatedAt' as admin.view.sort.field when timestamps: false opts the collection out", () => {
    // Also throws at runtime — `validateSavedListViewConfig` requires `sort.field`
    // to lead a declared index, and no `updatedAt` field/index exists here.
    expect(() =>
      defineCollection({
        slug: "posts",
        fields: { title: text() },
        timestamps: false,
        admin: {
          // @ts-expect-error — timestamps: false means no updatedAt field exists to sort by
          view: { sort: { field: "updatedAt", order: "desc" } },
        },
      }),
    ).toThrow();
  });

  it("rejects 'updatedAt' in indexes[].fields when timestamps: false", () => {
    defineCollection({
      slug: "posts",
      fields: { title: text() },
      timestamps: false,
      // @ts-expect-error — timestamps: false means no updatedAt field exists to index
      indexes: [{ name: "by_updated", fields: ["updatedAt"] }],
    });
  });

  it("CollectionDataFieldSlug resolves to the literal field union plus updatedAt by default", () => {
    expectTypeOf<CollectionDataFieldSlug<{ title: { type: "text" } }>>().toEqualTypeOf<
      "title" | "updatedAt"
    >();
  });

  it("CollectionDataFieldSlug excludes updatedAt when TTimestamps is the literal false", () => {
    expectTypeOf<
      CollectionDataFieldSlug<{ title: { type: "text" } }, false>
    >().toEqualTypeOf<"title">();
  });
});
