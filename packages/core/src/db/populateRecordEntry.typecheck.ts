import type { PopulateOptionForEntry } from "./types";

/**
 * Compile-time pin (W2): a `{ kind: "record" }` `PopulateMapEntry` (a
 * `keyValue()` field's value, mirroring `db/depth.ts`'s runtime
 * `{ kind: "record", populate }` shape) resolves a populate OPTION type
 * identical to its `value` entry's own kind standalone — one instruction
 * applied to every dynamically-keyed entry, not itself keyed by entry.
 *
 * A `record` DIRECTLY nested inside another `record`'s `value` (a
 * `keyValue()` whose own `value` is another `keyValue()`) resolves to
 * `never` in this manually-typed `populate: {...}` config — a documented,
 * one-level bound, NOT a bug: `PopulateOptionForEntry`'s `record` branch
 * must route through a NON-self-referential helper
 * (`SimplePopulateOptionForEntry`) rather than calling itself (or calling
 * `PopulateOptionForEntry` again), because a direct self-reference there —
 * verified empirically, including one attempt at supporting a second level
 * the same way — hits TypeScript's "Type instantiation is excessively deep
 * and possibly infinite" limit against `collections/api/find/server.ts`'s
 * own abstract, unresolved `TCollectionSlug`/`TPopulate` generics. Runtime
 * depth-populate (`db/depth.ts`) is NOT bounded this way — it never goes
 * through these conditional types — so `depth: N` auto-populate still
 * reaches a relationship nested inside keyValue-in-keyValue at any depth;
 * only the compile-time `populate: {...}` config caps at one `record`
 * level.
 *
 * `pnpm typecheck` IS the assertion, no test runner involved.
 */
type ScalarRelationshipEntry = { kind: "relationship"; target: "posts"; scalar: true };
type RecordOfRelationship = { kind: "record"; value: ScalarRelationshipEntry };
type RecordOfRecord = { kind: "record"; value: RecordOfRelationship };

type RelationshipOption = PopulateOptionForEntry<ScalarRelationshipEntry>;
declare const recordOption: PopulateOptionForEntry<RecordOfRelationship>;
declare const nestedRecordOption: PopulateOptionForEntry<RecordOfRecord>;

/** A `record` entry's option is the SAME shape its `value` entry's own kind needs standalone. */
const optionShapePin: RelationshipOption = recordOption;
void optionShapePin;

/** `record`-in-`record` is the documented one-level bound: resolves to `never`. */
const nestedBoundPin: never = nestedRecordOption;
void nestedBoundPin;
