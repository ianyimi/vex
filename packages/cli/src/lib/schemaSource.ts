/**
 * Text-level reader for `convex/schema.ts` and the generated `vex.schema.ts`.
 *
 * `syncSchemaImports` uses it to tell which tables `schema.ts` already lists, and
 * to compare a hand-written table against the generated table of the same name.
 * Nothing here evaluates the user's code: it reads source text, skipping strings
 * and comments, so it sees literal keys and literal `defineTable({...})` calls only.
 */

/** Docs page linked from every collision warning. */
export const ADOPT_GUIDE_URL = "https://docs.vexcms.dev/guides/adopt-existing-tables/";

/** One top-level entry of the `defineSchema({ ... })` object. */
export type SchemaEntry =
  /** `posts,` — the imported generated table. */
  | { kind: "shorthand"; name: string }
  /** `posts: <value>` or `"posts": <value>`. */
  | { kind: "property"; name: string; value: string }
  /** `[TABLE_SLUG_POSTS]: <value>` — the key is an expression, not a name. */
  | { kind: "computed"; key: string; value: string }
  /** A spread (`...tables`) or anything else that names no table by itself. */
  | { kind: "opaque" };

/** The parts of a `defineTable(...)` call the collision check compares. */
export interface TableShape {
  /** Field name → compacted validator source (`v.optional(v.string())`). */
  fields: Map<string, string>;
  /** Index name → compacted definition, across `.index`, `.searchIndex` and `.vectorIndex`. */
  indexes: Map<string, string>;
}

/** How a hand-written table differs from the generated one, by name. Every list is sorted. */
export interface TableDiff {
  fieldsOnlyInSchema: string[];
  fieldsOnlyGenerated: string[];
  fieldsChanged: string[];
  indexesOnlyInSchema: string[];
  indexesOnlyGenerated: string[];
  indexesChanged: string[];
}

/** A table or index in `schema.ts` that the generated schema also defines. */
export type SchemaCollision =
  /**
   * `schema.ts` defines the table by hand and the definitions differ. Convex uses
   * the hand-written one. `diff` is `undefined` when the hand-written value is not a
   * readable `defineTable({...})` call, so the two can't be compared.
   */
  | { kind: "table"; table: string; diff: TableDiff | undefined }
  /**
   * `schema.ts` chains indexes onto the imported generated table, and some share a
   * name with a generated index. Convex rejects duplicate index names.
   */
  | { kind: "index"; table: string; indexes: string[] };

const IDENTIFIER_CHAR = /[\w$]/;

/**
 * Index just past the string or comment that starts at `index`, or `index` itself
 * when none starts there.
 *
 * @param text - Source text.
 * @param index - Position to test.
 * @returns The first position after the string or comment.
 */
function skipStringOrComment(text: string, index: number): number {
  const char = text[index];
  if (char === "/" && text[index + 1] === "/") {
    const end = text.indexOf("\n", index);
    return end === -1 ? text.length : end;
  }
  if (char === "/" && text[index + 1] === "*") {
    const end = text.indexOf("*/", index + 2);
    return end === -1 ? text.length : end + 2;
  }
  if (char === '"' || char === "'" || char === "`") {
    let cursor = index + 1;
    while (cursor < text.length && text[cursor] !== char) {
      cursor += text[cursor] === "\\" ? 2 : 1;
    }
    return Math.min(cursor + 1, text.length);
  }
  return index;
}

/**
 * Drops comments and whitespace and turns single-quoted strings into
 * double-quoted ones, so two sources that differ only in formatting compact to
 * the same text. One space survives between two identifier characters
 * (`export const`), and string contents are kept as written.
 *
 * @param text - Source text.
 * @returns The compacted source.
 */
function compact(text: string): string {
  let out = "";
  let index = 0;
  let gap = false;
  while (index < text.length) {
    const char = text[index]!;
    const isComment = char === "/" && (text[index + 1] === "/" || text[index + 1] === "*");
    if (isComment || /\s/.test(char)) {
      // Whitespace and comments separate tokens; keep one space only where two
      // identifier characters would otherwise merge (`export const`).
      index = isComment ? skipStringOrComment(text, index) : index + 1;
      gap = true;
      continue;
    }
    if (gap && IDENTIFIER_CHAR.test(char) && IDENTIFIER_CHAR.test(out[out.length - 1] ?? "")) {
      out += " ";
    }
    gap = false;
    const next = skipStringOrComment(text, index);
    if (next !== index) {
      const inner = text.slice(index + 1, next - 1);
      out += char === "'" && !inner.includes('"') ? `"${inner}"` : text.slice(index, next);
      index = next;
      continue;
    }
    out += char;
    index++;
  }
  return out;
}

/**
 * Position of the bracket closing the `(`, `{` or `[` at `open`.
 *
 * @param text - Source text.
 * @param open - Position of the opening bracket.
 * @returns The closing bracket's position, or `-1` when it never closes.
 */
function findClose(text: string, open: number): number {
  let depth = 0;
  let index = open;
  while (index < text.length) {
    const next = skipStringOrComment(text, index);
    if (next !== index) {
      index = next;
      continue;
    }
    const char = text[index]!;
    if (char === "(" || char === "{" || char === "[") depth++;
    else if (char === ")" || char === "}" || char === "]") {
      depth--;
      if (depth === 0) return index;
    }
    index++;
  }
  return -1;
}

/**
 * Splits compacted text at its depth-0 commas — the entries of an object
 * literal body or the arguments of a call.
 *
 * @param text - Compacted source between the brackets.
 * @returns The non-empty parts, trimmed.
 */
function splitTopLevel(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  let index = 0;
  while (index < text.length) {
    const next = skipStringOrComment(text, index);
    if (next !== index) {
      index = next;
      continue;
    }
    const char = text[index]!;
    if (char === "(" || char === "{" || char === "[") depth++;
    else if (char === ")" || char === "}" || char === "]") depth--;
    else if (char === "," && depth === 0) {
      parts.push(text.slice(start, index));
      start = index + 1;
    }
    index++;
  }
  parts.push(text.slice(start));
  return parts.map((part) => part.trim()).filter((part) => part.length > 0);
}

/**
 * Normalizes a compacted validator so equivalent spellings compare equal:
 * trailing commas go, `v.float64()` becomes `v.number()` and `v.nullable(x)`
 * becomes `v.union(x,v.null())` (Convex treats each pair as the same validator).
 *
 * @param validator - Compacted validator source.
 * @returns The normalized source.
 */
function normalizeValidator(validator: string): string {
  let text = validator.replace(/,(?=[)}\]])/g, "").replace(/\bv\.float64\(\)/g, "v.number()");
  const nullable = "v.nullable(";
  for (let at = text.indexOf(nullable); at !== -1; at = text.indexOf(nullable)) {
    const open = at + nullable.length - 1;
    const close = findClose(text, open);
    if (close === -1) break;
    text = `${text.slice(0, at)}v.union(${text.slice(open + 1, close)},v.null())${text.slice(close + 1)}`;
  }
  return text;
}

/**
 * Reads the `.index(...)`, `.searchIndex(...)` and `.vectorIndex(...)` calls in
 * compacted source.
 *
 * @param code - Compacted source of a table expression (or its chain).
 * @returns Index name → normalized definition, prefixed by the index kind.
 */
function readIndexes(code: string): Map<string, string> {
  const indexes = new Map<string, string>();
  const pattern = /\.(index|searchIndex|vectorIndex)\(/g;
  for (let match = pattern.exec(code); match !== null; match = pattern.exec(code)) {
    const open = match.index + match[0].length - 1;
    const close = findClose(code, open);
    if (close === -1) break;
    const [nameSource = "", ...rest] = splitTopLevel(code.slice(open + 1, close));
    const name = /^"([^"]*)"$/.exec(nameSource)?.[1] ?? nameSource;
    indexes.set(name, `${match[1]}:${normalizeValidator(rest.join(","))}`);
    pattern.lastIndex = close;
  }
  return indexes;
}

/**
 * Lists the top-level entries of the `defineSchema({ ... })` object.
 *
 * @param props - Input props.
 * @param props.source - Source text of `convex/schema.ts`.
 * @returns The entries in source order, or `undefined` when the file has no
 *   `defineSchema({` object literal (e.g. `defineSchema(tables)`).
 */
export function readSchemaEntries(props: { source: string }): SchemaEntry[] | undefined {
  const code = compact(props.source);
  const match = /\bdefineSchema\(\{/.exec(code);
  if (match === null) return undefined;
  const open = match.index + match[0].length - 1;
  const close = findClose(code, open);
  if (close === -1) return undefined;

  return splitTopLevel(code.slice(open + 1, close)).map((entry): SchemaEntry => {
    if (entry.startsWith("[")) {
      const keyClose = findClose(entry, 0);
      if (keyClose !== -1 && entry[keyClose + 1] === ":") {
        return { kind: "computed", key: entry.slice(1, keyClose), value: entry.slice(keyClose + 2) };
      }
      return { kind: "opaque" };
    }
    const quoted = /^"([^"]+)":([\s\S]*)$/.exec(entry);
    if (quoted) return { kind: "property", name: quoted[1]!, value: quoted[2]! };
    const named = /^([A-Za-z_$][\w$]*):([\s\S]*)$/.exec(entry);
    if (named) return { kind: "property", name: named[1]!, value: named[2]! };
    if (/^[A-Za-z_$][\w$]*$/.test(entry)) return { kind: "shorthand", name: entry };
    return { kind: "opaque" };
  });
}

/**
 * Reads the fields and indexes of a `defineTable({ ... })` expression.
 *
 * @param props - Input props.
 * @param props.source - Source text of the table expression, chained indexes included.
 * @returns The table's shape, or `undefined` when it holds no `defineTable({` object
 *   literal or the object has an entry that isn't `key: validator` (a spread).
 */
export function readTableShape(props: { source: string }): TableShape | undefined {
  const code = compact(props.source);
  const match = /\bdefineTable\(\{/.exec(code);
  if (match === null) return undefined;
  const callOpen = match.index + match[0].length - 2;
  const objectOpen = callOpen + 1;
  const objectClose = findClose(code, objectOpen);
  const callClose = findClose(code, callOpen);
  if (objectClose === -1 || callClose === -1) return undefined;

  const fields = new Map<string, string>();
  for (const entry of splitTopLevel(code.slice(objectOpen + 1, objectClose))) {
    const field = /^(?:"([^"]+)"|([A-Za-z_$][\w$]*)):([\s\S]+)$/.exec(entry);
    if (!field) return undefined;
    fields.set((field[1] ?? field[2])!, normalizeValidator(field[3]!));
  }
  return { fields, indexes: readIndexes(code.slice(callClose + 1)) };
}

/**
 * Splits the generated `vex.schema.ts` into its exported tables.
 *
 * @param props - Input props.
 * @param props.source - Generated schema source.
 * @returns Export name → the table expression's source text.
 */
export function readGeneratedTables(props: { source: string }): Map<string, string> {
  const code = compact(props.source);
  const tables = new Map<string, string>();
  const pattern = /\bexport const ([A-Za-z_$][\w$]*)=/g;
  const matches = [...code.matchAll(pattern)];
  matches.forEach((match, position) => {
    const start = match.index! + match[0].length;
    const end = matches[position + 1]?.index ?? code.length;
    tables.set(match[1]!, code.slice(start, end).replace(/;\s*$/, ""));
  });
  return tables;
}

/**
 * Names present in `a` and missing from `b`, sorted.
 *
 * @param a - The map whose keys are listed.
 * @param b - The map the keys are checked against.
 * @returns The sorted names.
 */
function keysMissingFrom(a: Map<string, string>, b: Map<string, string>): string[] {
  return [...a.keys()].filter((key) => !b.has(key)).sort();
}

/**
 * Compares a hand-written table with the generated table of the same name.
 *
 * @param props - Input props.
 * @param props.schema - The hand-written table from `schema.ts`.
 * @param props.generated - The generated table.
 * @returns The differences, or `undefined` when the two match.
 */
function diffTables(props: { schema: TableShape; generated: TableShape }): TableDiff | undefined {
  const { schema, generated } = props;
  const diff: TableDiff = {
    fieldsOnlyInSchema: keysMissingFrom(schema.fields, generated.fields),
    fieldsOnlyGenerated: keysMissingFrom(generated.fields, schema.fields),
    fieldsChanged: [...schema.fields.keys()]
      .filter((key) => generated.fields.has(key) && generated.fields.get(key) !== schema.fields.get(key))
      .sort(),
    indexesOnlyInSchema: keysMissingFrom(schema.indexes, generated.indexes),
    indexesOnlyGenerated: keysMissingFrom(generated.indexes, schema.indexes),
    indexesChanged: [...schema.indexes.keys()]
      .filter((key) => generated.indexes.has(key) && generated.indexes.get(key) !== schema.indexes.get(key))
      .sort(),
  };
  return Object.values(diff).some((names) => names.length > 0) ? diff : undefined;
}

/**
 * Finds the tables and indexes `schema.ts` writes by hand that the generated schema
 * also defines. Only literal keys are checked: a computed key (`[TABLE_SLUG_X]`)
 * can't be named from text, so it is never reported.
 *
 * - `posts: defineTable({...})` with a generated `posts` → a `"table"` collision,
 *   unless the two definitions match (fields and indexes by name, validators
 *   compared after formatting is normalized).
 * - `posts: posts.index("by_slug", ...)` (indexes chained onto the import) → an
 *   `"index"` collision for each chained name the generated table also has.
 * - `posts,` and `posts: posts` are the import itself, never a collision.
 *
 * @param props - Input props.
 * @param props.entries - `readSchemaEntries` output for `schema.ts`.
 * @param props.generatedTables - `readGeneratedTables` output for the generated schema.
 * @returns One collision per affected table, in `schema.ts` order.
 */
export function findSchemaCollisions(props: {
  entries: readonly SchemaEntry[];
  generatedTables: ReadonlyMap<string, string>;
}): SchemaCollision[] {
  const collisions: SchemaCollision[] = [];
  for (const entry of props.entries) {
    if (entry.kind !== "property") continue;
    const generatedSource = props.generatedTables.get(entry.name);
    if (generatedSource === undefined || entry.value === entry.name) continue;
    const generated = readTableShape({ source: generatedSource });
    if (generated === undefined) continue;

    if (entry.value.startsWith(`${entry.name}.`)) {
      const duplicates = [...readIndexes(entry.value.slice(entry.name.length)).keys()]
        .filter((name) => generated.indexes.has(name))
        .sort();
      if (duplicates.length > 0) {
        collisions.push({ kind: "index", table: entry.name, indexes: duplicates });
      }
      continue;
    }

    const schema = readTableShape({ source: entry.value });
    if (schema === undefined) {
      collisions.push({ kind: "table", table: entry.name, diff: undefined });
      continue;
    }
    const diff = diffTables({ schema, generated });
    if (diff !== undefined) collisions.push({ kind: "table", table: entry.name, diff });
  }
  return collisions;
}

/**
 * Builds the warning text for one collision.
 *
 * @param props - Input props.
 * @param props.collision - The collision to describe.
 * @param props.schemaFile - Display path of the hand-written schema (`convex/schema.ts`).
 * @param props.generatedFile - Display path of the generated schema (`convex/vex.schema.ts`).
 * @returns A multi-line message for `logger.warn`.
 */
export function formatSchemaCollision(props: {
  collision: SchemaCollision;
  schemaFile: string;
  generatedFile: string;
}): string {
  const { collision, schemaFile, generatedFile } = props;
  if (collision.kind === "index") {
    const names = collision.indexes.map((name) => `"${name}"`).join(", ");
    return [
      `${schemaFile} adds index ${names} to the generated "${collision.table}" table, and ${generatedFile} already defines ${collision.indexes.length === 1 ? "an index" : "indexes"} with that name.`,
      "Convex rejects duplicate index names. Remove or rename the hand-written .index(...) call.",
      `See ${ADOPT_GUIDE_URL}`,
    ].join("\n");
  }

  const lines = [
    `${schemaFile} defines table "${collision.table}" by hand, and ${generatedFile} generates a different "${collision.table}" table. Convex uses the hand-written one; the generated table is not wired in.`,
  ];
  if (collision.diff === undefined) {
    lines.push("  The hand-written table is not a plain defineTable({...}) call, so the two can't be compared.");
  } else {
    const rows: [string, string[]][] = [
      [`fields only in ${schemaFile}`, collision.diff.fieldsOnlyInSchema],
      [`fields only in ${generatedFile}`, collision.diff.fieldsOnlyGenerated],
      ["fields with different validators", collision.diff.fieldsChanged],
      [`indexes only in ${schemaFile}`, collision.diff.indexesOnlyInSchema],
      [`indexes only in ${generatedFile}`, collision.diff.indexesOnlyGenerated],
      ["indexes with different definitions", collision.diff.indexesChanged],
    ];
    for (const [label, names] of rows) {
      if (names.length > 0) lines.push(`  ${label}: ${names.join(", ")}`);
    }
  }
  lines.push(
    `Describe these differences in the "${collision.table}" collection, then replace the hand-written entry with the generated import. See ${ADOPT_GUIDE_URL}`,
  );
  return lines.join("\n");
}
