# @vexcms/telemetry

## 0.1.0-alpha.28

### Patch Changes

- 595318e: `anonymizeConfig` now reports three more field attributes, all booleans/enums/counts per the
  existing privacy allowlist (never a value, name, or label): `nullable` (any data field),
  `schemaValidator` (`number`/`select`/`relationship`/`upload` fields with a storage override —
  which override, never the stored data), and `keyKind`/`hasDiscriminator`/`variantCount` for the
  three new field types (`bytes` reuses the existing `max`/`hasAccept` rows for `maxSize`/
  `accept`). The size cap and truncation behavior (`fitTelemetryEvent.ts`) are unchanged — these
  are small per-field scalars added to the existing flat `fields` array, not a new top-level
  payload section.

  No migration: additive fields only, allowlisted the same way every existing field attribute is.
