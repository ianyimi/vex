---
applies_to: ["packages/core/src/fields/**", "packages/react/src/components/fields/**", "packages/react/src/adapter.ts"]
---
# Adding a Field Type (verified recipe)

Verified against `packages/core/src/fields/upload/` (newest field). Follow in order.

## Core field module — `packages/core/src/fields/<type>/`
1. `types.ts` — `<Type>FieldInput extends BaseFieldInput` (all optional) + `<Type>Field
   extends BaseField` (resolved, required props). Both carry `readonly type`.
2. `config.ts` — `function <type>(options?)` applies defaults via nested spread merge;
   canonical deep-merge example: `packages/core/src/fields/date/config.ts:57-66`
   (`time: { defaults, ...options?.time, timePicker: { defaults, ...options?.time?.timePicker } }`).
3. `validator.ts` — `<type>FieldToValidator({ field }): string`, wrapped with
   `applyBaseValidators()` (adds `v.optional()` when not required).
4. `inputSchema.ts` — `<type>FieldToInputSchema({ field }): ZodType`, wrapped with
   `applyBaseInputSchemaMeta()`.
5. `index.ts` — barrel: types, config, validator, inputSchema.

## Core shared updates
6. `fields/constants.ts` — ADMIN_FIELDS entry `{ type, interfaceType, validator, defaultValue }`.
7. `fields/types.ts` — add `<Type>Field` to the `AdminField` union.
8. `fields/index.ts` — `export * from "./<type>"`.
9. `fields/validators/index.ts` + 10. `fields/inputSchemas/index.ts` — add switch cases.

## React — `packages/react/src/components/fields/<type>/`
11. `Input.tsx` via `createFieldInput<TValue, <Type>Field>(render)`.
12. `Cell.tsx` — `<Type>FieldCell(props: CellComponentProps<<Type>Field>)`.
13. `columnDef.tsx` — `<type>FieldToColumnDef()` factory (registered in fields/index.tsx).
14. `packages/react/src/adapter.ts` — add `{ input, cell }` to the `fields` map (TS
    enforces completeness).
15. `packages/react/src/index.ts` — re-export the config function; wrap with ReactHKT only
    if the field has component slots (like `relationship`), else pass through.

## Tests + verification
- Colocate `validator.test.ts` + `inputSchema.test.ts` (see testing/field-type-testing.md).
- `pnpm --filter @vexcms/core typecheck && pnpm --filter @vexcms/react typecheck`; add the
  field to a collection in apps/test, render in create modal + list view.
