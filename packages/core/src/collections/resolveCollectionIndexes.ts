import { ADMIN_FIELDS, getDataFields, type AdminField, type ResolvedFieldIndexConfigInput } from "../fields";

/** One index a collection declares, after precedence — exactly what the schema creates. */
export interface ResolvedCollectionIndex {
  /** The Convex index name, which `withIndex` names. */
  name: string;
  /** Field keys in index order. Logical: a `draftStatus` index's `vex_status` prefix is not included. */
  fields: readonly string[];
  /** The `draftStatus` of whichever declaration won, if it set one. */
  draftStatus?: true | "both";
  /** Which kind of declaration won. */
  source: "field" | "collection" | "relationship";
}

/** A field's `index` in one shape. */
type FieldIndexDeclaration = { name: string; additionalFields: readonly string[]; draftStatus?: true | "both" };

/**
 * Normalizes a field's `index` to the object form.
 *
 * @param index - The string shorthand or the object form.
 * @returns The declaration with `additionalFields` defaulted to `[]`.
 */
function toFieldIndexDeclaration(index: ResolvedFieldIndexConfigInput): FieldIndexDeclaration {
  if (typeof index === "string") return { name: index, additionalFields: [] };
  return {
    name: index.name,
    additionalFields: index.additionalFields ?? [],
    ...(index.draftStatus !== undefined ? { draftStatus: index.draftStatus } : {}),
  };
}

/**
 * Every index a collection declares, in schema order (collection-level entries
 * first, then field-level and automatic relationship indexes in field order), with
 * precedence applied: an explicit field-level `index` wins over a collection-level
 * `indexes` entry of the same name, which wins over a relationship field's
 * automatic `by_<fieldKey>` index.
 *
 * The one source of index truth. The schema generator, `vex generate`, access-rule
 * validation, the draft-status lookup and `defineCollection` all read it, so they
 * cannot disagree about which indexes exist. Fields inside `tabs` / `row` /
 * `collapsible` count under their data keys (`getDataFields`).
 *
 * @param props - Input props.
 * @param props.collection - A collection, or a global (which declares no `indexes`).
 * @returns The resolved indexes.
 * @throws {Error} When two fields declare the same index name; when a field-level
 *   index takes another relationship field's automatic name; when `additionalFields`
 *   names an unknown field, the field itself, or a field twice; or when two
 *   collection-level `indexes` entries share a name.
 */
export function resolveCollectionIndexes(props: {
  collection: {
    slug: string;
    fields: Record<string, AdminField>;
    indexes?: readonly { name: string; fields: readonly string[]; draftStatus?: true | "both" }[];
  };
}): ResolvedCollectionIndex[] {
  const { slug } = props.collection;
  const dataFields = getDataFields({ fields: props.collection.fields });
  const fieldKeys = new Set(Object.keys(dataFields));
  const at = `defineCollection: collection "${slug}"`;

  // 1. Explicit field-level indexes, keyed by name.
  const fieldLevel = new Map<string, ResolvedCollectionIndex>();
  for (const [fieldKey, field] of Object.entries(dataFields)) {
    if (field.index === undefined) continue;
    const declared = toFieldIndexDeclaration(field.index);
    const taken = fieldLevel.get(declared.name);
    if (taken !== undefined) {
      throw new Error(
        `${at}: fields "${taken.fields[0]}" and "${fieldKey}" both declare index "${declared.name}". ` +
          `Declare a compound index once, on its first field — index: { name: "${declared.name}", additionalFields: ["${fieldKey}"] } on "${taken.fields[0]}" — or in the collection's indexes.`,
      );
    }
    const listed = new Set<string>([fieldKey]);
    for (const extra of declared.additionalFields) {
      if (!fieldKeys.has(extra)) {
        throw new Error(`${at}: index "${declared.name}" on field "${fieldKey}" lists "${extra}" in additionalFields, which is not a field of this collection.`);
      }
      if (listed.has(extra)) {
        throw new Error(`${at}: index "${declared.name}" on field "${fieldKey}" lists "${extra}" twice (the field itself always comes first).`);
      }
      listed.add(extra);
    }
    fieldLevel.set(declared.name, {
      name: declared.name,
      fields: [fieldKey, ...declared.additionalFields],
      ...(declared.draftStatus !== undefined ? { draftStatus: declared.draftStatus } : {}),
      source: "field",
    });
  }

  // 2. A relationship field without its own `index` gets `by_<fieldKey>`; an explicit
  //    field-level index may not take that name from another field.
  for (const [fieldKey, field] of Object.entries(dataFields)) {
    if (field.type !== ADMIN_FIELDS.relationship.type || field.index !== undefined) continue;
    const explicit = fieldLevel.get(`by_${fieldKey}`);
    if (explicit !== undefined) {
      throw new Error(
        `${at}: field "${explicit.fields[0]}" declares index "by_${fieldKey}", the automatic index name of relationship field "${fieldKey}". ` +
          `Rename the index, or give "${fieldKey}" its own index.`,
      );
    }
  }

  // 3. Assemble in schema order.
  const resolved: ResolvedCollectionIndex[] = [];
  const collectionLevelNames = new Set<string>();
  for (const index of props.collection.indexes ?? []) {
    if (collectionLevelNames.has(index.name)) {
      throw new Error(`${at}: declares index "${index.name}" twice in indexes.`);
    }
    collectionLevelNames.add(index.name);
    if (fieldLevel.has(index.name)) continue; // the field-level declaration wins
    resolved.push({
      name: index.name,
      fields: [...index.fields],
      ...(index.draftStatus !== undefined ? { draftStatus: index.draftStatus } : {}),
      source: "collection",
    });
  }
  for (const [fieldKey, field] of Object.entries(dataFields)) {
    if (field.index !== undefined) {
      resolved.push(fieldLevel.get(toFieldIndexDeclaration(field.index).name)!);
    } else if (field.type === ADMIN_FIELDS.relationship.type && !collectionLevelNames.has(`by_${fieldKey}`)) {
      resolved.push({ name: `by_${fieldKey}`, fields: [fieldKey], source: "relationship" });
    }
  }
  return resolved;
}
