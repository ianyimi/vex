---
applies_to: ["packages/core/src/fields/**/*.test.ts"]
---
# Field Type Testing

Every field type gets a PAIR of colocated tests:

- **validator.test.ts** — assert `<type>FieldToValidator({ field })` emits the correct
  `v.*()` expression string; required vs optional wrapping
  (`packages/core/src/fields/upload/validator.test.ts:5-18`: required → `v.array(v.id(...))`,
  optional → wrapped in `v.optional()`). Nested fields propagate required/optional to items
  (`packages/core/src/fields/array/validator.test.ts:5-45`).
- **inputSchema.test.ts** — assert the Zod schema from `<type>FieldToInputSchema({ field })`
  via parse/safeParse: valid data parses, invalid throws, optional accepts undefined
  (`packages/core/src/fields/upload/inputSchema.test.ts:5-18`). Group/object schemas
  default missing optional sub-fields (`packages/core/src/fields/group/inputSchema.test.ts:4-27`).
- No shared fixtures: construct field configs inline via the public config function
  (`upload({ to: "images", required: true })`).
