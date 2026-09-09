import { runHooksSuite } from "../testing/hooksSuite";

/**
 * `useTableSelection` is pure state + callbacks, so these are state-transition
 * tests over its four-mode machine (`none` → `page` → `all`/`inverse` →
 * `none`), with boundary-value cases at the edges of each transition: the
 * last row deselected (mode collapses to `none`), an empty `selectPage`, an
 * already-empty `clearSelection`, toggling the same row twice, an id absent
 * from the current page, the select-all-then-deselect-one indeterminate
 * transition, `getSelectionCount` with `totalCount` absent (defaults to 0)
 * versus present, and inverse mode's count going negative when
 * `selectedIds.size` exceeds `totalCount`. `UseTableSelectionReturn` has no
 * `indeterminate` field, so "indeterminate derivation" is tested as a
 * consumer would derive it — from `state.mode` and `state.selectedIds`
 * alone — via a small local helper in `../testing/hooksSuite.tsx`, not a
 * hook-exposed property.
 *
 * Per this spec's Test Authoring Protocol, assertions encode INTENDED
 * behavior — a change callback reports the state after the change it
 * announces, and "select all except one" means that one row reports
 * unselected — not whatever the current implementation happens to do. Two
 * defects fall out of that: `toggleRow`'s `onSelectionChange` reporting a
 * stale pre-toggle `mode` (`BUGS-REPORT HOOK-3`), and `toggleRow` called
 * while `mode === "all"` silently failing to exclude the row
 * (`BUGS-REPORT HOOK-5`). Both are asserted as intent, left failing, and
 * tagged inline.
 *
 * The assertions themselves live in `../testing/hooksSuite.tsx`'s
 * `runHooksSuite`, alongside this package's other shared test factories.
 */
runHooksSuite({ only: ["useTableSelection"] });
