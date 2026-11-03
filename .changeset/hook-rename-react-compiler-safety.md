---
"@vexcms/react": patch
---

Renamed 10 client-helper functions that internally call `useConvexMutation` to their plain
name with a `use` prefix: `create`→`useCreate`, `update`→`useUpdate`, `remove`→`useRemove`
(`collections/api/*`), `updateGlobal`→`useUpdateGlobal` (`globals/api/upsert`),
`saveDraft`→`useSaveDraft`, `publish`→`usePublish`, `unpublish`→`useUnpublish`,
`deleteVersion`→`useDeleteVersion` (`versions/api/*`), and `saveView`→`useSaveView`,
`removeView`→`useRemoveView` (`collections/api/{saveView,removeView}`).

A function that calls a hook internally but isn't itself named with a `use` prefix is treated
as a plain, memoizable value by the React Compiler (`reactCompiler: true`, enabled in
`apps/test`) — on a later render the compiler can skip re-invoking it entirely, silently
dropping the internal `useConvexMutation` call and crashing with a hooks-order mismatch. This
surfaced live as a real crash in `ListViewModifiedControls.tsx`'s `saveView()`/`removeView()`
calls; renaming those two first, then sweeping every other case of the same shape, fixes the
hazard at its root rather than per-call-site.

No behavior change — every renamed function has the identical signature and return shape, just
a new name. Every call site across `@vexcms/react`/`@vexcms/next` is updated; there is no
re-export under the old name.
