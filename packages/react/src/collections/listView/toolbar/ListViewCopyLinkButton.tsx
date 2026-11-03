"use client";

import { useCopyToClipboard } from "@ts-hooks-kit/core";
import { toast } from "sonner";
import { Button } from "../../../ui/button";
import type { ActionPlacement } from "../../../ui/ActionsMenu";

/** Props for {@link ListViewCopyLinkButton}. */
export interface ListViewCopyLinkButtonProps {
  /**
   * Builds the href to copy. Defaults to `window.location.href`. Step 12
   * overrides this when a local view is active, serializing the full state
   * via `serializeListViewUrlState` instead of `view=local:…`
   * (Decision 11: "when you copy a link while a local view is active,
   * serialize the full state").
   */
  buildHref?: () => string;
  /**
   * Which surface this render is for (mirrors the edit view's
   * `DocumentCancelAction`/`LivePreviewToggleAction` convention) —
   * `"inline"` (default) renders the toolbar button, `"menu"` renders a
   * full-width ghost row for `ListViewToolbar`'s ⋯ overflow (which, since
   * list-view-overhaul Step 16, is itself a `DataTableResponsiveMenu` — a
   * `Popover`/`Sheet`, never a `DropdownMenu` — so the menu form can't
   * depend on Base UI's Menu primitives, unlike the edit view's own
   * `EditActionsMenuItem`). No `vex.list.*` id (Decision 17 never names
   * one) — rendered directly by `ListViewToolbar`, like `DataTablePageSizeSelect`.
   *
   * `ListViewToolbar` mounts this component TWICE — once with `placement`
   * omitted (inline), once with `placement="menu"` — each wrapped in a CSS
   * class showing it on opposite sides of the `@2xl/list` breakpoint
   * (Decision 43). Both forms copy the same href; there is nothing to
   * shrink beyond swapping the control itself.
   */
  placement?: ActionPlacement;
}

/**
 * Copies the current (or caller-built) list URL to the clipboard — a
 * toolbar button (`placement` omitted/`"inline"`) or a full-width menu row
 * (`placement="menu"`), rendered for `ListViewToolbar`'s ⋯ overflow.
 *
 * @param props - Component props. See {@link ListViewCopyLinkButtonProps}.
 * @returns A ghost button or a menu row, depending on `placement`.
 */
export function ListViewCopyLinkButton(props: ListViewCopyLinkButtonProps) {
  const [, copyToClipboard] = useCopyToClipboard();

  async function handleClick() {
    const href = (props.buildHref ?? (() => window.location.href))();
    const ok = await copyToClipboard(href);
    if (ok) {
      toast.success("Link copied");
    } else {
      toast.error("Couldn't copy the link");
    }
  }

  if (props.placement === "menu") {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-full"
        icon="Link"
        contentJustify="start"
        onClick={() => void handleClick()}
      >
        Copy link
      </Button>
    );
  }

  return <Button variant="ghost" size="icon" icon="Link" aria-label="Copy link" onClick={handleClick} />;
}
