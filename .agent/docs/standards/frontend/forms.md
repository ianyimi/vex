---
applies_to: ["packages/react/src/forms/**", "packages/react/src/fields/**"]
---
# Forms (TanStack Form)

- The exported **app form** (`@vexcms/react/form`, `packages/react/src/forms/`)
  wraps TanStack Form. `formContext.ts`'s `createFormHookContexts()` produces
  `fieldContext`/`formContext`; leaf components read them via
  `useFieldContext()`/`useFormContext()` — never `fieldDef`, config, or
  permissions. `AppForm.tsx` puts the form instance in context and handles
  error-scroll-to-focus on submit; `useAppForm.ts`'s `createFormHook()`
  registers every leaf (`TextField`, `ArrayField`, `BlocksField`, …) as a
  `fieldComponent`.
- `FormFieldLayout.tsx` renders the label/description/error/index chrome
  every leaf shares; `isFieldShowingError`/`fieldDescribedBy` (also exported
  from `forms/`) compute error-visibility and `aria-describedby` wiring.
- The admin panel's field components (`packages/react/src/fields/<type>/Field.tsx`,
  e.g. `TextFieldAdmin`) are the layer ABOVE the app form — they read
  `fieldDef`, `VexConfigContext`, and permissions, then render the matching
  `forms/` leaf underneath via `AdminFieldBinding`. A collection/global edit
  view only ever renders `fields/<type>/Field.tsx` components.
- Two override slots, both resolved inside the admin field layer (see the
  Admin Customization guide, `apps/docs/src/content/docs/guides/admin-customization.mdx`):
  `admin.components.Input` (`FieldControlProps` — control only, resolved via
  `useFieldControlOverride()` and passed down as the leaf's `renderControl`
  prop) and `admin.components.Field` (`FieldComponentProps` — the whole
  field, including `renderDefault` to fall back to the built-in).
- Validation runs Zod via `safeParse()` against the schema each core field's
  `<type>/inputSchema.ts` produces; the same schemas drive the admin form and
  server Convex mutations. `fields/array/Field.tsx` and `fields/blocks/Field.tsx`
  use `forms/useArrayItems.ts` for add/duplicate/remove/move/reorder.
- Submission: the collection edit view's mutation uses the `@vexcms/react/client`
  factory functions (`create()`/`update()`/`remove()`) as `mutationFn` —
  never a bare re-export of `vexConvexApi.*`.
- Internal handlers are `handleXxx` (`handleBulkDelete`); callback props are
  `onXxx`.
