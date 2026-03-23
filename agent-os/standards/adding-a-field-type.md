# Adding a New Field Type to VEX CMS

Definitive checklist for adding a new field type. Follow this order — each step depends on the previous ones.

## Critical Principles

### Single Source of Truth for Rendering
`renderFieldByType()` in `AppForm.tsx` is the **only place** where field types are mapped to React components. Every context that renders fields — top-level forms, tabs, blocks, arrays, objects, create document dialog — uses this single function recursively. **Never duplicate field rendering logic** in component-specific switch statements.

### Recursive `renderField` Callback Pattern
Container field types (blocks, arrays, objects, tabs) receive a `renderField` callback from AppForm that delegates back to `renderFieldByType`. This enables arbitrary nesting — blocks containing arrays of objects with color fields inside, etc. — without any container needing to know about every possible field type.

The callback signature:
```typescript
type RenderFieldCallback = (props: {
  field: { state: { value: unknown }; handleChange: (value: unknown) => void };
  fieldDef: VexField;
  name: string;
}) => React.ReactNode;
```

Container components that manage their own value (like BlocksField and ArrayField) create synthetic field adapter objects `{ state: { value }, handleChange }` and pass them to the callback. This lets them participate in the rendering system without being wired into TanStack Form's field tree.

### Every Field Type Works Everywhere
When you add a new field type, it automatically works inside blocks, arrays, objects, and tabs because they all delegate to `renderFieldByType`. You do NOT need to add cases to BlocksField, ArrayField, ObjectField, or TabsField — only to `renderFieldByType`.

## Required Files (all field types)

### 1. Type Definition
**`packages/core/src/types/fields.ts`**
- Add interface extending `BaseField` with `readonly type: "fieldname"`
- Add `defaultValue` property if the field supports defaults
- Add to the `VexField` discriminated union (bottom of file)
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
- Call `processFieldValueTypeOptions()` with `field`, `collectionSlug`, `fieldName`, `expectedType`, and `valueType` params
- Note: must match the exact signature — see `textToValueTypeString` for reference
- **Multi-line output**: If the field generates complex nested output (objects, unions), use multi-line formatting with newlines to avoid prettier reformatting issues. See `objectToValueTypeString` and `blocksToValueTypeString` for examples.

### 5. Schema Dispatcher
**`packages/core/src/valueTypes/extract.ts`**
- Import the schemaValueType function
- Add case in `fieldToValueType()` switch
- If the field contains sub-fields (like `object` or `blocks`), pass `fieldToValueType` as the `resolveInnerField` callback

### 6. Schema Generator (if field has special expansion behavior)
**`packages/core/src/valueTypes/generate.ts`**
- Only needed if the field type expands into multiple schema fields (like `tabs`)
- The `expandFields()` function handles special field types that produce multiple entries
- Most field types don't need this — the default `fieldToValueType()` dispatch is sufficient

### 7. TypeScript Type Generation
**`packages/core/src/typeGen/fieldToTypeString.ts`**
- Add case in `fieldToTypeString()` switch
- Return the TS type string (e.g., `"string"`, `"number"`, `"boolean"`)

### 8. Type Generation Imports (if field returns a custom type)
**`packages/core/src/typeGen/generateVexTypes.ts`**
- Only needed if `fieldToTypeString` returns a non-primitive type name
- Add import check (similar to how `needsRichTextImport` checks for `RichTextDocument`)
- Add the import to the generated file header

### 9. Form Schema (Zod Validation)
**`packages/core/src/formSchema/generateFormSchema.ts`**
- Add case in `fieldMetaToZod()` switch
- Return appropriate Zod validator
- For container types with sub-fields (like `object`), recursively call `fieldMetaToZod` for each sub-field

### 10. Form Default Values
**`packages/core/src/formSchema/generateFormDefaultValues.ts`**
- Add case in `getFormDefaultValue()` switch
- Return zero-value for the field type
- For container types with sub-fields (like `object`), recursively call `getFormDefaultValue` for each sub-field

### 11. Column Definition
**`packages/core/src/fields/{fieldname}/columnDef.ts`**
- Export function returning `ColumnDef<Record<string, unknown>>`
- Configure accessorKey, header, optional cell renderer
- For non-visible field types (like `tabs`, `ui`), skip this file and add the type to the skip list in `generateColumns.ts` instead

### 12. Column Dispatcher
**`packages/core/src/columns/generateColumns.ts`**
- Import the columnDef function and add case in `buildColumnDef()` switch
- OR add the field type to the skip conditions (`if (field.type === "ui" || field.type === "tabs") continue;`) if it shouldn't appear in list columns

### 13. Module Exports
**`packages/core/src/fields/{fieldname}/index.ts`**
- Re-export from `./config`, `./schemaValueType`, `./columnDef`

**`packages/core/src/fields/index.ts`**
- Add export for the factory function

**`packages/core/src/index.ts`**
- Add to field helpers section (factory function export)
- Add type to type exports section (interface export)

## Admin UI (for fields with visual form input)

### 14. Form Component
**`packages/ui/src/components/form/fields/{FieldName}Field.tsx`**
- React component for admin panel form editing
- Receives `field` (TanStack Form field adapter), `fieldDef` (VexField definition), `name` (field key)
- **Container field types** (those with sub-fields like `object`, `array`, `blocks`) must accept an optional `renderField` callback prop for recursive rendering. This callback is provided by AppForm and delegates to `renderFieldByType`. Container components create synthetic field adapters `{ state: { value }, handleChange }` to bridge their internal value management with the rendering callback.

### 15. Form Component Export
**`packages/ui/src/components/form/fields/index.ts`**
- Add export for the new form component

### 16. AppForm Integration
**`packages/ui/src/components/form/AppForm.tsx`**
- Import the form component at top of file
- Add `case "fieldtype":` in the `renderFieldByType()` function's switch statement
- This is the centralized renderer — adding the case here makes it work everywhere:
  - Top-level form fields
  - Inside tabs (recursive)
  - Inside blocks (recursive via `renderField` callback)
  - Inside arrays (recursive via `renderField` callback)
  - Inside objects (recursive via `renderField` callback)
  - In create document dialog
  - In any future form context
- For container types, pass a `renderField` callback that delegates to `renderFieldByType`:
  ```typescript
  case "myContainer":
    return wrap(
      <MyContainerField
        field={renderField}
        fieldDef={renderFieldDef}
        name={renderName}
        renderField={({ field: syntheticField, fieldDef: subFieldDef, name: subName }) =>
          renderFieldByType(syntheticField, subFieldDef, subName)
        }
      />,
    );
  ```
- **Do NOT duplicate field rendering logic** — `renderFieldByType` is the single source of truth

### 17. Rebuild Packages
**After modifying AppForm, rebuild both packages and restart dev:**
```bash
pnpm --filter @vexcms/ui build && pnpm --filter @vexcms/admin-next build
```
Then restart `vex dev` in the app to pick up changes. The jiti module loader caches modules — a running `vex dev` process won't see rebuilt packages until restarted.

## Test Files (recommended)

### Unit Tests
- `packages/core/src/fields/{fieldname}/config.test.ts` — factory function
- `packages/core/src/fields/{fieldname}/schemaValueType.test.ts` — schema generation
- `packages/core/src/fields/{fieldname}/columnDef.test.ts` — column definition

### Integration Test Updates
- Update `packages/core/src/typeGen/fieldToTypeString.test.ts` — add case for new type
- Update `packages/core/src/formSchema/generateFormSchema.test.ts` — add Zod validator test
- Update `packages/core/src/formSchema/generateFormDefaultValues.test.ts` — add default value test

## Verification

After all files are updated:

1. `pnpm --filter @vexcms/core test` — all tests pass
2. `pnpm --filter @vexcms/core build` — builds without errors
3. `pnpm --filter @vexcms/ui build` — builds (if form component added)
4. `pnpm --filter @vexcms/admin-next build` — builds (if form component added)
5. `pnpm build` — full monorepo build passes
6. Add the field to a collection in apps/www, restart `vex dev`, verify:
   - Schema generates correctly (`vex.schema.ts`)
   - Types generate correctly (`vex.types.ts`)
   - Admin panel renders the field in edit form
   - Admin list view shows the field in columns (or skips it appropriately)
   - Create document dialog works with the field
   - Field works inside tabs (if applicable)
   - **Field works inside blocks** — add the field to a block definition and verify it renders
   - **Field works inside arrays** — use it as `array({ field: yourField() })` and verify

## Common Patterns

### String-based fields (like `color`, `imageUrl`)
- Use `TEXT_VALUETYPE` from constants
- `fieldToTypeString` returns `"string"`
- Form schema returns `z.string()`
- Default value returns `""`

### Non-persisted fields (like `ui`, `tabs`)
- Skip in column generation (`continue` in generateColumns loop)
- Form schema returns `z.any()`
- Default value returns `undefined` or `{}`
- May need special handling in `generate.ts` for schema expansion

### Container fields with sub-fields (like `object`, `blocks`, `array`)
- Accept a `renderField` callback prop for recursive rendering via AppForm
- Create synthetic field adapters `{ state: { value }, handleChange }` to bridge internal state with the callback
- Schema value type function accepts `resolveInnerField` callback to avoid circular imports
- Use multi-line formatting in schema output to prevent prettier issues
- `generateFormDefaultValues` recursively generates defaults for sub-fields
- `fieldMetaToZod` recursively generates Zod validators for sub-fields
- The `arrayToValueTypeString` strips `v.optional()` from inner field types since array wrapping handles optionality

### Fields with nested structure (like `tabs`, `blocks`)
- Need recursive rendering support in AppForm via `renderField` callback
- The `renderFieldByType` function handles this — container components call it for their sub-fields
- Schema generation may need custom expansion in `generate.ts`'s `expandFields()`
