import type { Id } from "@convex/_generated/dataModel";
import type { MutationCtx } from "@convex/_generated/server";

import type { Image, Page } from "~/vex.types";

import { TABLE_SLUG_IMAGES } from "~/db/constants";

declare const ctx: MutationCtx;
declare const image: Image;
declare const page: Page;

/**
 * Compile-time pin for the OTHER half of the same seed pattern: a fresh
 * `ctx.db.insert(TABLE_SLUG_IMAGES, {...})` already returns the branded
 * `Id<"images">` (Convex's own typed `insert`, scoped to this project's
 * generated schema — no vex-specific typing needed), and `Page.testImage`
 * (an `upload({ to: TABLE_SLUG_IMAGES })` field) already generates
 * `Id<"images">[]`, not `string[]`. The cast the examples carry
 * (`{ photo: [id] as never }`) comes ONLY from laundering that id through a
 * `Map<string, string>` before this assignment — never from a library gap —
 * which this pin proves by skipping the Map and assigning the real inserted
 * id straight through.
 */
async function pinInsertedIdAcceptsUploadField() {
  const insertedId: Id<"images"> = await ctx.db.insert(TABLE_SLUG_IMAGES, {
    alt: "pin",
    filename: "pin.jpg",
    height: 1,
    mimeType: "image/jpeg",
    size: 1,
    src: "",
    storageId: image.storageId,
    width: 1,
  });

  await ctx.db.patch(page._id, { testImage: [insertedId] });
}

/**
 * Compile-time pin for the exact cast pattern the four examples'
 * `convex/seedImages.ts` carry (`ctx.storage.getUrl(image.storageId as
 * never)`, `ctx.db.patch(_, { photo: [id] as never })`) — `pnpm typecheck`
 * IS the assertion, no test runner involved.
 *
 * `defineMediaCollection`'s `storageId` field now overrides its generated
 * interface type to `Id<"_storage">` (was `string`, from the plain `text()`
 * leaf it's built from) — the exact type `ctx.storage`'s non-deprecated
 * `getUrl`/`delete`/`get` overload requires. Called against the REAL
 * generated `Image` document (not a hand-rolled stand-in) and the REAL
 * `MutationCtx`, so this fails the moment either drifts.
 */
async function pinStorageIdAcceptsRealImageDocument() {
  const url = await ctx.storage.getUrl(image.storageId);
  void url;
  await ctx.storage.delete(image.storageId);
}

export { pinInsertedIdAcceptsUploadField, pinStorageIdAcceptsRealImageDocument };
