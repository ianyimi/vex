---
"@vexcms/react": patch
---

Fixes the "Save blocked but nothing scrolled to the error" bug — three compounding gaps,
not just one:

- **`DocumentSaveAction`'s "Save"/"Save Draft" button never counted as a submit attempt.**
  It performed its own `saveDraft`/`update`/`upsert` mutation directly and, on rejection,
  called `applyVexFieldErrors` but never rethrew (`fix-silent-save-and-create-form`'s own
  fix stopped there) — so TanStack Form's `submissionAttempts`/`isSubmitSuccessful` never
  changed and `AppForm`'s `failedSubmitAttempt` effect (the only caller of
  `focusFirstFieldError`) never ran, for ANY field, on ANY edit view, regardless of nesting.
  The button now does only `form.handleSubmit()`; the versioned/non-versioned write itself
  moved into `CollectionEditView`'s and `GlobalEditView`'s own `onSubmit` (now the single
  path both this button and native submit share), each catching, applying, and rethrowing.
  A bonus of routing through `handleSubmit()`: a client-side schema failure now blocks the
  write before any network call, same as every other form in the app.
- **`applyVexFieldErrors` collapsed a nested server error onto the wrong (top-level) field.**
  A Zod issue's `path` was joined down to `path[0]` only — an array item's own validation
  failure (`["tagList", 0]`) landed on `tagList`'s meta, never `tagList[0]`'s. Now joins the
  full path with the same `.key`/`[index]` convention every nested field registers under.
- **A primitive array item's own invalid state was never marked in the DOM.** Every other
  leaf field gets a `[data-field-invalid]` wrapper from `RenderFields`'s `FieldSlotOutlet`;
  `array()`'s scalar (non-group) item type mounted its admin field directly, bypassing it.
  `focusFirstFieldError` could only ever resolve to the whole array, landing on whichever
  control happened to be first in DOM order — now the item's own wrapper exists, so the
  exact invalid item is what gets scrolled to and focused.
