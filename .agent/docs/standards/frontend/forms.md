---
applies_to: ["packages/react/src/components/form/**", "packages/react/src/hooks/useCollectionForm.ts", "packages/react/src/components/fields/**"]
---
# Forms (TanStack Form)

- Forms use TanStack Form + shadcn inputs. `AppForm` puts the form instance in context
  (`packages/react/src/components/form/AppForm.tsx`); field inputs are created with
  `createFieldInput<TValue, TField>(render)` (`components/form/createFieldInput.tsx`).
- `useCollectionForm` (`packages/react/src/hooks/useCollectionForm.ts:40`) pre-configures a
  form for a collection: `defaultValues` from field defaults, the collection's Zod input
  schema wired as `onBlur` and `onSubmitAsync` validators.
- Validation runs Zod via `safeParse()`; the same schemas drive client forms and server
  Convex mutations. Dynamic lists use `field.pushValue()` / `field.removeValue()`.
- Submission: `useMutation({ mutationFn: useConvexMutation(vexConvexApi.update) })`
  (`components/views/CollectionEditView.tsx:59-61`). Mutation client files export
  `create()` / `update()` / `remove()` FACTORY functions that call `useConvexMutation`
  internally — consumers write `mutationFn: create()`; never bare re-exports of
  `vexConvexApi.*`.
- Internal handlers are `handleXxx` (`handleBulkDelete`); callback props are `onXxx`.
