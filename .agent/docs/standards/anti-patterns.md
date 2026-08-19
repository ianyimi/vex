# Anti-Patterns

Corrected agent mistakes. Append-only: `- AP-NNN (YYYY-MM-DD, seen Nx) rule`. Never compact.

- AP-001 (2026-08-12, seen 1x) Never default a type parameter to `Record<string, never>` — its `keyof` is a string index signature that poisons mapped-type intersections (collapses sibling unions to `never`); default optional record generics to `{}`.
- AP-002 (2026-08-12, seen 1x) Never assert an inline object type just to read a property (`(x as { y: string }).y`), including in test fixtures — use a named const with a one-line reason or a real `in`/`typeof` guard.
- AP-003 (2026-08-12, seen 1x) Never constrain a registry-map `infer` to the ENTRY type (`infer D extends VexDocument` on a slug→doc map) — the constraint describes the map, not its values; a failed `extends` silently collapses the whole registry to its fallback with errors surfacing far from the cause.
