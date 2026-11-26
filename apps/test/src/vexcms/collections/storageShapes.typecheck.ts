import type { HiddenDocument, Populated, RelationshipTargetOf } from "@vexcms/core";

import { TABLE_SLUG_STORAGE_SHAPES } from "~/db/constants";
import type { UserDocument } from "~/vex.types";

/**
 * Compile-time pin: `RelationshipTargetOf` recovers the real target slug
 * ("user") for a scalar relationship regardless of which `schema.validator`
 * the field uses — `ownerId` ("id" storage) and `ownerRef` ("string"
 * storage) both resolve to the SAME narrow slug, not the full `CollectionSlug`
 * union, since the redesigned type reads `CollectionsPopulateMap` (built
 * from `field.collection.slug` at config time) rather than pattern-matching
 * the generated document's interface type — "string" storage's interface
 * type is a bare `string` with no slug to recover from.
 */
function pinScalarRelationshipTargetIsNarrow(
  idTarget: RelationshipTargetOf<typeof TABLE_SLUG_STORAGE_SHAPES, "ownerId">,
  stringTarget: RelationshipTargetOf<typeof TABLE_SLUG_STORAGE_SHAPES, "ownerRef">,
) {
  const idTargetIsUser: "user" = idTarget;
  const stringTargetIsUser: "user" = stringTarget;
  void idTargetIsUser;
  void stringTargetIsUser;
}

/**
 * Compile-time pin: populating a scalar relationship (`ownerId`) resolves to
 * a bare doc/`HiddenDocument` union, never an array — the exact shape a
 * consumer needs with no `[0]` unwrap and no cast (P-030).
 */
function pinScalarRelationshipPopulateIsNotAnArray(
  doc: Populated<typeof TABLE_SLUG_STORAGE_SHAPES, { ownerId: true }>,
) {
  const owner: UserDocument | HiddenDocument<"user"> | undefined = doc.ownerId;
  void owner;
  // @ts-expect-error — a scalar relationship's populated value is never an array
  const ownerAsArray: unknown[] = doc.ownerId;
  void ownerAsArray;
}

export { pinScalarRelationshipPopulateIsNotAnArray, pinScalarRelationshipTargetIsNarrow };
