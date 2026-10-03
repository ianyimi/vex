---
"@vexcms/react": minor
---

**BREAKING: `useCollectionForm` and `useGlobalForm` are replaced by `useFieldsForm`.** Both
hooks only ever read their config's `fields`, so the form hook now takes the field map
directly and works for any owner of one. Migrate by passing `fields`:

```ts
// before
useCollectionForm({ collection, document, onSubmit });
useGlobalForm({ global, document, onSubmit });
// after
useFieldsForm({ fields: collection.fields, document, onSubmit });
useFieldsForm({ fields: global.fields, document, onSubmit });
```

The submitted value's type is the `TData` generic (default `TDocument`) instead of being
inferred from the config's slug — pass `useFieldsForm<DocumentBySlug["posts"]>(...)` to
keep a per-collection type.
