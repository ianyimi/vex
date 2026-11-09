title: Wire the existing AdminNotFound component into its 6 remaining TODO call sites
labels: good first issue, type: bug, area: ui

## Context

`packages/react/src/admin/AdminNotFound.tsx` is a shared not-found component, and its own JSDoc says
it "replaces every 'TODO: add not found view' text block" — but the call sites were never migrated.
Six still render a bare `<p>Collection not found.</p>`-style placeholder instead:
`packages/react/src/collections/editView/CollectionEditView.tsx` (3 call sites — collection, document,
and currentDocument not-found branches), `packages/react/src/globals/GlobalEditView.tsx` (1),
`packages/react/src/media/MediaCollectionEditView.tsx` (2).

## Scope

Replace each placeholder `<p>...</p>` with `<AdminNotFound variant="..." detail="..." backHref="..."
backLabel="..." />`, picking the right `variant` (`"collection" | "global" | "document"`) and `backHref`
for each case — `AdminNotFound`'s own JSDoc has a worked example.

## Acceptance criteria

- [ ] All 6 call sites render `AdminNotFound` instead of a bare paragraph
- [ ] Each one passes a `detail` string including the caller-supplied slug/id (not a config-derived
      label — see `AdminNotFoundProps.detail`'s own doc comment for why)
- [ ] A changeset is added for `@vexcms/react`

## Out of scope

Any other "not found" state in the codebase not listed above.
