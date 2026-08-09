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
- **ADMIN_FIELDS:** one entry per type with `{ type, interfaceType, validator,
  defaultValue }` (`packages/core/src/fields/constants.ts:38-43`).
- **No field-type-level admin defaults:** keep `admin.width: "full"` and
  `admin.cellAlignment: "left"` base defaults; users opt into overrides. `date()`
  defaultValue is `undefined`, not 0 (no silent 1970 pre-fill).
