# Adding a New Field Type to VexCMS

Definitive checklist for adding a new field type. Follow in order — each step depends on the previous ones. Use the `text` field as the canonical reference implementation.

---

## Core package (`packages/core/src/fields/[type]/`)

### 1. `types.ts`

Define two interfaces following the `TextField` / `TextFieldInput` pattern:

- `[Type]FieldInput extends BaseFieldInput` — user-facing config (all properties optional)
- `[Type]Field extends BaseField` — resolved type after defaults (required properties are always present)

Both must have `readonly type: AdminFieldType` (input can be optional, resolved must be required).

### 2. `config.ts`

Export `function [type](options?: [Type]FieldInput): [Type]Field` that applies all defaults. Follow the exact same structure as `text()` in `packages/core/src/fields/text/config.ts`.

### 3. `validator.ts`

Export `function [type]FieldToValidator(props: { field: [Type]Field }): string` that returns the Convex schema validator string. Call `applyBaseValidators()` from `../validators/utils` to wrap in `v.optional()` when `field.required` is false.

### 4. `inputSchema.ts`

Export `function [type]FieldToInputSchema(props: { field: [Type]Field }): ZodSchema` that returns the Zod schema for admin form validation. Call `applyBaseInputSchemaMeta()` from `../inputSchemas/utils` to apply `optional().default()` for non-required fields.

### 5. `index.ts`

```ts
export * from "./types";
export * from "./config";
export * from "./validator";
export * from "./inputSchema";
```

---

## Core package — shared file updates

### 6. `packages/core/src/fields/constants.ts`

Add to `ADMIN_FIELDS`:

```ts
[type]: {
  type: "[type]",
  validator: "v.xxx()",
  defaultValue: <zero value>,
},
```

### 7. `packages/core/src/fields/types.ts`

Add `[Type]Field` to the `AdminField` union.

Import the new type at the top of the file.

### 8. `packages/core/src/fields/index.ts`

Add `export * from "./[type]"`.

### 9. `packages/core/src/fields/validators/index.ts`

Add an import and a `case` in the `adminFieldToValidator` switch:

```ts
case ADMIN_FIELDS.[type].type:
  return [type]FieldToValidator({ field: props.field });
```

### 10. `packages/core/src/fields/inputSchemas/index.ts`

Add an import and a `case` in the `adminFieldToInputSchema` switch.

---

## React package (`packages/react/src/fields/[type]/`)

### 11. `Input.tsx`

Use `createFieldInput<TValue, [Type]Field>(render)` from `../../components/form/createFieldInput`. The render function receives `{ name, fieldDef, field, submissionAttempts }`. Show errors only when `field.state.meta.isTouched || submissionAttempts > 0`. Use `<FormError field={field} submissionAttempts={submissionAttempts} />` if it exists, or inline the error display.

### 12. `Cell.tsx`

Export `[Type]FieldCell(props: CellComponentProps<[Type]Field>)`. Render the field value for the data table list view. Handle null/undefined gracefully (show `—`).

### 13. `index.ts`

```ts
export * from "./Input";
export * from "./Cell";
```

---

## React package — shared file updates

### 14. `packages/react/src/fields/index.tsx`

- Import `[Type]FieldInput` and `[Type]FieldCell` from `./[type]`
- Add `[ADMIN_FIELDS.[type].type]: [Type]FieldInput` to `fieldInputComponents`
- Add `export * from "./[type]"`

### 15. `packages/react/src/adapter.ts`

Add to the `fields` object in `reactAdapter`:

```ts
[type]: {
  input: [Type]FieldInput,
  cell: [Type]FieldCell,
},
```

TypeScript will error here until both components are added — intentional type enforcement.

### 16. `packages/react/src/index.ts`

Export `[Type]FieldInput` and `[Type]FieldCell`.

---

## If a new UI primitive is needed

Add to `packages/react/src/components/ui/[component].tsx` following the existing component style (Base UI primitives wrapped with Tailwind via `cn()`). Export from `packages/react/src/components/ui/index.ts`.

---

## Verification

1. TypeScript: `pnpm --filter @vexcms/core typecheck` and `pnpm --filter @vexcms/react typecheck` pass
2. `adapter.ts` no longer shows a type error for the missing field
3. Add the field to a collection in `apps/www`, verify it renders in the create modal and list view
