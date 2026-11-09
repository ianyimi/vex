import {
  defineCollection,
  COLLECTION_INPUT,
  type CollectionConfig,
  type CollectionConfigInput,
} from "../collections";
import { VexAuthConfigError, type AuthCollectionConfig, AuthFieldMeta } from "./types";
import type { AdminField } from "../fields";
import type { CollectionSlug } from "../types/generated";

/**
 * Merges auth collections with user-defined collections, respecting
 * `protected` at the collection level and `meta.locked` on individual fields.
 *
 * Merge rules:
 * 1. User collections that match a `protected` auth slug throw an error.
 * 2. Iterate remaining user collections in their declared order.
 * 3. If a user collection's slug matches an auth collection, merge the two
 *    RAW inputs (recovered via {@link COLLECTION_INPUT}, see
 *    {@link mergeSingleCollection}) and re-resolve with `defineCollection()`
 *    — the merged collection appears at the user's declared position.
 * 4. Auth collections with no matching user collection are appended at the end.
 * 5. User collections with no matching auth collection are added as-is.
 *
 * @param props — authCollections, userCollections
 * @param props.authCollections — Collections from the auth adapter.
 * @param props.userCollections — Collections defined by the user.
 * @throws VexAuthConfigError when users pass a protected collection slug.
 * @returns Merged collections array for `VexConfig`.
 */
export function mergeAuthCollections(props: {
  authCollections: AuthCollectionConfig[];
  userCollections: CollectionConfig[];
}): CollectionConfig[] {
  const { authCollections, userCollections } = props;
  const protectedSlugs = new Set(
    authCollections.filter((c) => c.meta?.protected).map((c) => c.slug),
  );
  for (const userCol of userCollections) {
    if (protectedSlugs.has(userCol.slug)) {
      throw new VexAuthConfigError(
        `Collection slug "${userCol.slug}" is protected by the auth adapter and cannot be overridden.`,
      );
    }
  }

  const authBySlug = new Map(authCollections.map((c) => [c.slug, c]));
  const merged: CollectionConfig[] = [];
  const consumedAuthSlugs = new Set<string>();

  for (const userCol of userCollections) {
    const authCol = authBySlug.get(userCol.slug);
    if (authCol) {
      merged.push(mergeSingleCollection(authCol, userCol));
      consumedAuthSlugs.add(userCol.slug);
    } else {
      merged.push(userCol);
    }
  }

  for (const authCol of authCollections) {
    if (!consumedAuthSlugs.has(authCol.slug)) {
      merged.push(authCol);
    }
  }

  return merged;
}

function isFieldLocked(field: AdminField<AuthFieldMeta>): boolean {
  return field?.meta?.locked === true;
}

function isMergeablePlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  if (Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Generic deep merge `mergeSingleCollection` runs over every input key but
 * `fields` (which has its own locked-field rule, below).
 *
 * - A plain object on both sides (prototype `Object.prototype` or `null` —
 *   excludes arrays, class instances, `Date`, etc.) merges key-by-key,
 *   recursively — including objects that are really one value made of
 *   parts, like `admin.view.sort` and `admin.view.where`. For `sort` that is
 *   useful (a project `order` without `field` keeps the adapter's `field`);
 *   for `where` it is NOT an AND of both filters — matching keys take the
 *   project's value, and mixed shapes (`and` vs. a single clause) land in one
 *   object. Today no adapter sets `where`.
 * - Anything else — arrays, functions, class instances, primitives — the
 *   project's (`userValue`) side replaces the adapter's (`authValue`) side
 *   whole. There's no sane positional merge for an array like `admin.views`.
 * - A project value of `undefined` never overwrites: a key the project
 *   genuinely never touched falls through to the adapter's value, at every
 *   depth.
 *
 * @param authValue - The adapter's value for this key (or nested key).
 * @param userValue - The project's value for the same key.
 * @returns The merged value.
 */
function deepMergeConfig(authValue: unknown, userValue: unknown): unknown {
  if (userValue === undefined) return authValue;
  if (isMergeablePlainObject(authValue) && isMergeablePlainObject(userValue)) {
    const merged: Record<string, unknown> = { ...authValue };
    for (const key of Object.keys(userValue)) {
      merged[key] = deepMergeConfig(authValue[key], userValue[key]);
    }
    return merged;
  }
  return userValue;
}

/**
 * Merges one auth collection with the user collection sharing its slug.
 *
 * Reads both sides' RAW `defineCollection()` input back via the
 * non-enumerable {@link COLLECTION_INPUT} symbol — a resolved
 * `CollectionConfig` has already had every default applied (e.g.
 * `admin.view.columns` filled in from the auth adapter's OWN fields), and an
 * ordinary `{...authBase, ...userCol}` spread of the RESOLVED configs
 * replaces the adapter's whole `admin` object with the project's, silently
 * dropping adapter-only settings like `disableCreate`. Merging the raw
 * inputs and re-resolving with `defineCollection()` avoids that.
 *
 * `fields`: the project's field replaces the auth field whole, unless the
 * auth field is `meta.locked`, in which case the auth field wins (unchanged
 * from before). Every other top-level key — `admin`, `labels`, `meta`,
 * `versions`, `hooks`, `indexes`, `timestamps`, `interfaceName` — goes
 * through the generic {@link deepMergeConfig}.
 *
 * @param authCollectionConfig - The auth adapter's collection.
 * @param userCollectionConfig - The project's collection sharing `authCol`'s slug.
 * @returns The merged, re-resolved `CollectionConfig`.
 * @throws {VexAuthConfigError} When either side carries no raw input —
 *   both collections must be built with `defineCollection()`; a collection
 *   assembled by spreading another collection's resolved output (rather than
 *   calling `defineCollection()` on the modified input) has none.
 */
function mergeSingleCollection(
  authCollectionConfig: AuthCollectionConfig,
  userCollectionConfig: CollectionConfig,
): CollectionConfig {
  const authInput = authCollectionConfig[COLLECTION_INPUT];
  const userInput = userCollectionConfig[COLLECTION_INPUT];

  if (!authInput) {
    throw new VexAuthConfigError(
      `Auth collection "${authCollectionConfig.slug}" carries no raw defineCollection() input to merge — build it with defineCollection(). ` +
        `To modify a resolved collection, call defineCollection() on the modified input instead of spreading the result.`,
    );
  }
  if (!userInput) {
    throw new VexAuthConfigError(
      `Collection "${userCollectionConfig.slug}" carries no raw defineCollection() input to merge — build it with defineCollection(). ` +
        `To modify a resolved collection, call defineCollection() on the modified input instead of spreading the result.`,
    );
  }

  // Fields keep the pre-existing locked-field rule rather than the generic
  // merge above: a plain deepMergeConfig would merge two field OBJECTS
  // key-by-key (one field's `admin`/`meta` bleeding into the other's), not
  // pick one field definition over the other whole.
  //
  // `authInput`/`userInput` read off the untyped `COLLECTION_INPUT` escape
  // hatch (`collections/types.ts`), so their `fields` come back as
  // `AdminField<{}>` — narrowed here against the auth side's real
  // `AuthFieldMeta`, the one boundary this merge actually depends on
  // (`isFieldLocked`'s `meta.locked` read).
  const authFields = authInput.fields as Record<string, AdminField<AuthFieldMeta>>;
  const fields: AuthCollectionConfig["fields"] = { ...authFields };
  for (const [fieldName, userField] of Object.entries(userInput.fields)) {
    const authField = authFields[fieldName];
    if (!authField || !isFieldLocked(authField)) {
      fields[fieldName] = userField as AdminField<AuthFieldMeta>;
    }
  }

  const { fields: _authFields, ...authRest } = authInput;
  const { fields: _userFields, ...userRest } = userInput;
  // Trusted output of our own deepMergeConfig above, over two
  // CollectionConfigInput-shaped objects (minus `fields`, merged separately).
  const mergedRest = deepMergeConfig(authRest, userRest) as Omit<
    CollectionConfigInput<AuthFieldMeta, {}, CollectionSlug>,
    "fields"
  >;

  const mergedInput: CollectionConfigInput<AuthFieldMeta, {}, CollectionSlug> = {
    ...mergedRest,
    fields,
  };

  return defineCollection(mergedInput) as CollectionConfig;
}
