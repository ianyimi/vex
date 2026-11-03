import { cn } from "../utils/cn";

/**
 * A small, ALWAYS-VISIBLE grip mark at a resizable edge's own handle
 * (developer-reported, `DataTable`'s own column resize: the handle
 * itself — the `w-1.5` `role="separator"` hit target — is invisible
 * until hovered/focused/dragged, giving a user no indication an edge is
 * resizable at all without first stumbling onto it) — a short (14px),
 * thin (2px) muted bar, vertically centered, rendered as the handle's
 * own child.
 *
 * NOT centered within the handle's own hit-target box — anchored to the
 * SAME edge the parent handle itself anchors to, offset by `-1px` (not
 * `0`) so a HALF of the grip's own 2px width sits on each side of that
 * edge (`right: -1px` centers a 2px element exactly on a 0px line).
 *
 * Extracted from `DataTable.tsx`'s own `resolveResizeGripClass` (column
 * resize) so the peek panel's own resize handle (Decision, developer-
 * approved: "same look and behavior as the DataTable column-resize
 * handles") reuses the EXACT same classes rather than a copy that could
 * drift.
 *
 * @param handleAnchorSide - Which edge the PARENT handle itself anchors to.
 */
export function resolveResizeGripClass(handleAnchorSide: "left" | "right"): string {
  return cn(
    "pointer-events-none absolute top-1/2 h-3.5 w-0.5 -translate-y-1/2 rounded-full bg-muted-foreground/50",
    handleAnchorSide === "right" ? "right-[-1px]" : "left-[-1px]",
  );
}

/**
 * The full-height/full-edge divider HIGHLIGHT — a primary-colored line
 * at rest `opacity-0` (not `display:none`/absent, so toggling it never
 * shifts anything), `opacity-100` + `bg-primary` once its owner reports
 * hover, focus, OR drag (`data-active="true"`), `transition-opacity` for
 * a soft fade. `pointer-events-none` — never intercepts a click/hover
 * meant for the resize handle itself (which sits at the SAME position)
 * or anything underneath it.
 *
 * Extracted from `DataTable.tsx`'s own `DIVIDER_HIGHLIGHT_CLASS` (column
 * resize) for the SAME reuse reason {@link resolveResizeGripClass}
 * documents. `DataTable` still applies its own z-index on top of this
 * (`resolveDividerZIndexClass`, pin-state-dependent, table-specific —
 * not part of this shared string); a single-element caller like the
 * peek panel's own left-edge handle doesn't need one.
 */
export const DIVIDER_HIGHLIGHT_CLASS =
  "pointer-events-none absolute top-0 h-full w-0.5 bg-primary opacity-0 transition-opacity data-[active=true]:opacity-100";
