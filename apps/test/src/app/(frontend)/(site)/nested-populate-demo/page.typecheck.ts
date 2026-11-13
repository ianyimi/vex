import { vexFindQuery } from "@vexcms/core";

import { vex } from "~/lib/vex";

/**
 * Compile-time pin for the fix behind `page.tsx`'s zero-cast
 * `vexFindQuery(vex, { collection: "fields", populate: {...} })` call.
 *
 * Before this fix, `vex.query(api.vex.find, {...})` returned `unknown` (one
 * Convex function serving every collection, so codegen fixes ONE return type
 * for it — a runtime `collection`/`populate` value can never narrow it),
 * forcing `page.tsx`'s `(docs as Record<string, unknown>[] | undefined)?.[0]`
 * cast. `vexFindQuery` re-attaches the call-site type by casting the SAME
 * function reference (`@vexcms/core`'s `findFuncRef`) — no runtime behavior
 * change, only the TYPE the boundary erased.
 *
 * `pnpm typecheck` IS the assertion, same convention as
 * `~/vexcms/collections/fields.typecheck.ts`.
 */
async function pin() {
  const docs = await vexFindQuery(vex, {
    collection: "fields",
    limit: 1,
    populate: {
      content: {
        container: { relatedArticle: true },
        stat_group: { stats: { icon: true } },
      },
      info: { coverImage: true },
    },
  });
  const doc = docs[0];

  // Pin: `content`'s `container` block's `relatedArticle` resolved to the
  // real `Article` document (its `title` compiles once narrowed off the
  // `HiddenDocument` RBAC-denial placeholder arm) — a raw `Id<"articles">`
  // array has no `.title` at all, hidden or not.
  if (doc?.content) {
    for (const block of doc.content) {
      if (block.blockType === "container") {
        const relatedArticleTitles: string[] | undefined = block.relatedArticle
          ?.filter((article) => "title" in article)
          .map((article) => article.title);
        void relatedArticleTitles;
      }
      if (block.blockType === "stat_group") {
        for (const stat of block.stats ?? []) {
          const iconFilenames: string[] | undefined = stat.icon
            ?.filter((image) => "filename" in image)
            .map((image) => image.filename);
          void iconFilenames;
        }
      }
    }
  }

  // Pin: `info.coverImage` resolved to the real `Image` document (its
  // `filename` compiles once narrowed) — a raw `Id<"images">` array has no
  // `.filename` at all, hidden or not.
  const coverImageFilenames: string[] | undefined = doc?.info?.coverImage
    ?.filter((image) => "filename" in image)
    .map((image) => image.filename);
  void coverImageFilenames;


  // Pin: an unregistered collection slug is rejected — no network boundary
  // to erase this one, the slug is a compile-time literal.
  // @ts-expect-error — "not-a-collection" is not a registered collection slug
  await vexFindQuery(vex, { collection: "not-a-collection" });

  // Pin: a populate key that is not a `fields` relationship/upload field
  // (or group/blocks container) is rejected.
  await vexFindQuery(vex, {
    collection: "fields",
    // @ts-expect-error — "nope" is not a populatable field on "fields"
    populate: { nope: true },
  });
}

export const nestedPopulateDemoTypePins = pin;
