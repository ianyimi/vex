---
applies_to: ["packages/core/src/fields/**", "packages/core/src/collections/**"]
---
# Field Config & Resolution Conventions

- **Input → resolved:** every field type ships `<Type>FieldInput` (user config, optional
  props) and `<Type>Field` (post-defaults, props always present: `label`, `required`,
  full `admin.*`, `interfaceType`). `<type>()` converts input → resolved
  (`packages/core/src/fields/upload/types.ts`).
- **Defaults deep-merge:** base defaults literal → `...options` → re-apply nested objects
  recursively with their own defaults (`packages/core/src/fields/date/config.ts:57-66`).
  Config functions deep-merge so components can read `fieldDef.<nested>` without
  conditional logic.
- **interfaceType stamping:** resolved fields carry `interfaceType` (TS type string, e.g.
  `"string"`, `"Id<CollectionSlug>[]"`), stamped from `ADMIN_FIELDS[type].interfaceType`
  at config time (`packages/core/src/fields/upload/config.ts:31`). Generators read
  `field.interfaceType` directly — never a lookup at generation time. Similarly,
  `defineCollection` stamps `interfaceName` on the resolved config.
- **Widget naming rule:** field types are named for the UI widget, never the data type —
  `checkbox()` not `boolean()`, `select()` not `string()`.
- **ADMIN_FIELDS:** one entry per type with `{ type, interfaceType, validator, defaultValue,
  kind, inputMasks, hasNullToggle }` (`packages/core/src/fields/constants.ts`).
- **No field-type-level admin defaults:** keep `admin.width: "full"` and
  `admin.cellAlignment: "left"` base defaults; users opt into overrides. `date()`
  defaultValue is `undefined`, not 0 (no silent 1970 pre-fill).
- **`nullable` is a base option, not per-type:** `BaseFieldInput.nullable?: boolean` /
  `BaseField.nullable: boolean` (resolved, default `false`) is resolved once, same as
  `required`/`label`/`admin.*` — a field type's own `config.ts` never redeclares it.
  `applyBaseValidators` wraps `v.nullable(X)` before `v.optional(X)`; `applyBaseInputSchemaMeta`
  mirrors it with `.nullable()` before `.optional()`.
- **`schema.validator` storage overrides are opt-in, drawn from one constants map:**
  `FIELD_SCHEMA_VALIDATORS` (`fields/constants.ts`) is the single source of validator-name
  literals (`"int64"`, `"literal"`, `"string"`, `"id"`); a field type exposing an override types
  its own `schema?: { validator?: <subset of FIELD_SCHEMA_VALIDATORS> }` against that map, never
  a parallel inline union. On a type that also has `hasMany`, `schema` is typed `never` when
  `hasMany: true` — overrides only apply to single-value storage. Omitting `schema` entirely
  leaves the field's default storage unchanged (non-breaking).
