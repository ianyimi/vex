# Adding a New Field Type to VEX CMS

Definitive checklist for adding a new field type. Follow this order — each step depends on the previous ones.

## Required Files (all field types)

### 1. Type Definition
**`packages/core/src/types/fields.ts`**
- Add interface extending `BaseField` with `readonly type: "fieldname"`
- Add to the `VexField` discriminated union
- Add case to `InferFieldType<F>` conditional type

### 2. Factory Function
**`packages/core/src/fields/{fieldname}/config.ts`**
- Export factory function: `export function fieldname(props?: {...}): FieldNameDef`
- Return object with `type: "fieldname"` and spread options

### 3. Field Constants (if needed)
**`packages/core/src/fields/constants.ts`**
- Add `export const FIELDNAME_VALUETYPE = "v.<type>()" as const`
- Skip if reusing an existing constant (e.g., `TEXT_VALUETYPE` for string fields)

### 4. Schema Value Type
**`packages/core/src/fields/{fieldname}/schemaValueType.ts`**
- Export function that returns the Convex schema string
- Call `processFieldValueTypeOptions()` for optional wrapping

### 5. Schema Dispatcher
**`packages/core/src/valueTypes/extract.ts`**
- Import the schemaValueType function
- Add case in `fieldToValueType()` switch

### 6. TypeScript Type Generation
**`packages/core/src/typeGen/fieldToTypeString.ts`**
- Add case in `fieldToTypeString()` switch
- Return the TS type string (e.g., `"string"`, `"number"`, `"boolean"`)

### 7. Form Schema (Zod Validation)
**`packages/core/src/formSchema/generateFormSchema.ts`**
- Add case in `fieldMetaToZod()` switch
- Return appropriate Zod validator

### 8. Form Default Values
**`packages/core/src/formSchema/generateFormDefaultValues.ts`**
- Add case in `getFormDefaultValue()` switch
- Return zero-value for the field type

### 9. Column Definition
**`packages/core/src/fields/{fieldname}/columnDef.ts`**
- Export function returning `ColumnDef<Record<string, unknown>>`
- Configure accessorKey, header, optional cell renderer

### 10. Column Dispatcher
**`packages/core/src/columns/generateColumns.ts`**
- Import the columnDef function
- Add case in `buildColumnDef()` switch

### 11. Module Exports
**`packages/core/src/fields/{fieldname}/index.ts`**
- Re-export from `./config`, `./schemaValueType`, `./columnDef`

**`packages/core/src/fields/index.ts`**
- Add export for the factory function

**`packages/core/src/index.ts`**
- Add to field helpers section
- Add type to type exports section

## Conditional Files

### 12. Form Component (if field needs custom input)
**`packages/ui/src/components/form/fields/{FieldName}Field.tsx`**
- React component for admin panel form editing
- Export from `packages/ui/src/components/form/fields/index.ts`

### 13. AppForm Integration (if form component added)
**`packages/ui/src/components/form/AppForm.tsx`**
- Import the form component
- Add case in the field rendering switch

## Test Files (recommended)

- `packages/core/src/fields/{fieldname}/schemaValueType.test.ts`
- `packages/core/src/fields/{fieldname}/columnDef.test.ts`
- `packages/core/src/fields/{fieldname}/config.test.ts`
- Update `packages/core/src/typeGen/fieldToTypeString.test.ts`
- Update `packages/core/src/formSchema/generateFormSchema.test.ts`
- Update `packages/core/src/formSchema/generateFormDefaultValues.test.ts`

## Verification

After all files are updated:
1. `pnpm --filter @vexcms/core test` — all tests pass
2. `pnpm --filter @vexcms/core build` — builds without errors
3. `pnpm build` — full monorepo build passes
4. Add the field to a collection in test-app/www, run `vex dev`, verify:
   - Schema generates correctly (`vex.schema.ts`)
   - Types generate correctly (`vex.types.ts`)
   - Admin panel renders the field in edit form
   - Admin list view shows the field in columns
   - Create document dialog works with the field
