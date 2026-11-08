title: Richtext editor loses scroll position on refresh
labels: help wanted, type: feature, adapter: richtext-plate

## Context

A richtext field's editor box (`PlateEditorField`'s `maxHeight: 500; overflowY: auto` wrapper) always
re-mounts scrolled to the top — a refresh, or the admin form re-mounting, loses your place in a long
document. The design is already approved (see below); this is a "help wanted" because it touches three
packages and a context most contributors haven't worked in yet, not because the shape is undecided.

## Scope

- Key: `vex-richtext-scroll:<collection>:<documentId>:<fieldPath>` in `localStorage`. No key in create
  mode (no document id yet) — nothing persisted.
- An optional `persistenceKey?: string` on core's `VexEditorComponentProps`; a small document-identity
  context provided by `CollectionEditView`/`GlobalEditView` (field inputs don't receive the document id
  today); the richtext `Input` in `@vexcms/react` builds the key and passes it to the editor.
- Save on `onScrollEnd` (`scrollTop > 0` → write, `0` → remove); debounced `scroll` fallback for
  browsers without `onscrollend`.
- Restore once after mount, then re-apply via a `ResizeObserver` until the target offset is reachable,
  the user scrolls, or ~2s pass (content height grows after mount as the editor chunk and images load).

## Acceptance criteria

- [ ] Scrolling a long richtext field and refreshing the page restores the scroll position
- [ ] Switching to create mode (no document id) persists nothing and throws no errors
- [ ] Open question before starting: which document id keys the entry — the first autosave of a
      published document creates a draft row with a different id than the URL's; verify which id a
      refresh actually reopens before implementing, or the saved offset orphans after the first autosave

## Out of scope

Any editor other than the richtext field's Plate.js editor.
