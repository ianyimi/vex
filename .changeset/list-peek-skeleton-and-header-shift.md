---
"@vexcms/react": patch
---

Fixed the list view peek (Inspect) panel's loading skeleton showing nearly nothing: the
`<Suspense>` fallback (`ListPeekPanel`'s own `document === undefined` branch, shown while a
deep-linked peek — one whose id isn't among the list's already-loaded rows — is still
fetching) used to render 5 structurally unrelated `Skeleton` bars with no header, no tabs,
and no field labels/keys at all, collapsing the header down to just the close button
(`titleValue` was `undefined` the same way a genuinely not-found document's is). Investigated
live on `:3020` (the "Fields" collection's own `Field Example` fixture) via a forced Suspense
path (a filtered list, then a client-side `peek=` navigation to an id excluded by that
filter), confirmed against `ListViewPeek.test.tsx`'s existing "suspends with the loading
skeleton" case.

`ListViewPeekFieldsTab` now accepts `document: TDocument | undefined` and renders the SAME
row list either way — ID (the real `peekId`, known synchronously, no fetch needed), Created
(when the system key is readable), then one row per `visibleFieldEntries` with its real
label/key — only swapping each row's VALUE slot for a `Skeleton` while `document` is still
pending. `ListPeekPanel`'s own content ternary collapsed from three branches to two (not-found
vs. everything else): the Fields/JSON tabs now mount identically whether pending or loaded,
so the fallback can never drift from the settled structure as a second, hand-maintained tree.
`ListViewPeekJsonTab` already carried its own independent `rawDocument`-pending skeleton, so
it needed no changes. `conditionFields` (`ListPeekPanel`) no longer blanket-returns `{}`
whenever `document` is `null`/`undefined` — it evaluates each field's `admin.condition`
against `{}` instead (`isFieldConditionMet` already returns `true` for any field with no
condition, regardless of `data`), so the common case (no conditional fields at all) resolves
its full field set during the Suspense fallback too.

Also fixed the header's own position text ("Field Example · 2 of 4") shifting the
`useAsTitle` title horizontally/vertically as it appeared — reproduced live by diffing the
title's own measured rect with/without that line present (a 6px vertical shift, 53px→49px
header height), since the title+position block had no reserved height and the header's
`items-center` re-centered it differently once the second line's row was added. The title
block now reserves a fixed `h-4` slot for the position line unconditionally — filled with the
real "N of M" string when settled with a known row index, a `Skeleton` while pending, or left
empty (reserved, not removed) for a settled deep-linked peek with no row list to wrap within
— so the title's own position is identical across all three states. The avatar and the
Edit/Previous/Next controls render in the same pending state too (Edit needs only
`peekId`/`collection.slug`, both already known before any fetch resolves).

Added structural-parity coverage (`ListViewPeek.test.tsx`): the pending state shows the same
labels/keys/tabs the settled state does (checked synchronously, before `waitFor`, and again
after resolution), and the position-text slot keeps its `h-4` reserved height across a real
string, a loading skeleton, and the empty no-row-list case.
