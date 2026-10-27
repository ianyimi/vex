"use client";

import type { LivePreviewBreakpoint } from "@vexcms/core";
import type { AnyFormApi } from "../forms";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../ui/sheet";
import { LivePreviewPanel } from "./LivePreviewPanel";

/**
 * The live-preview surface below the mobile breakpoint — a `Sheet` (`side="bottom"`) that slides
 * up from the bottom and covers the screen except a thin strip of the page left visible at the
 * top, rather than the full-screen takeover a desktop split panel would otherwise render as.
 *
 * Built on `ui/sheet.tsx` (Base UI `Dialog` underneath) so Esc-to-close, a click on the backdrop,
 * a trapped focus ring, and locking the page behind from scrolling all come for free. The sheet's
 * own close button is hidden (`showCloseButton={false}`) — `LivePreviewPanel`'s own toolbar
 * already renders the close control, positioned opposite the "open in a new tab" link via
 * `justify-between`, which is both the layout this overlay needs and the one already shared with
 * the desktop toolbar.
 *
 * @param props.open - Whether the overlay is open — driven by the same panel state the header
 *   button and ⋯ menu item toggle, NOT a separate open flag; mount this component whenever the
 *   viewport is below the mobile breakpoint so the slide animation plays on every toggle, not
 *   just the first one.
 * @param props.onOpenChange - Called with `false` on Esc, a backdrop click, or the panel's own
 *   close button — the caller should route this through the same explicit toggle the header
 *   button uses, so the choice is remembered the same way.
 * @param props.previewUrl - Forwarded to `LivePreviewPanel`.
 * @param props.collectionSlug - Forwarded to `LivePreviewPanel`.
 * @param props.documentId - Forwarded to `LivePreviewPanel`.
 * @param props.tempId - Forwarded to `LivePreviewPanel`.
 * @param props.debounceMs - Forwarded to `LivePreviewPanel`.
 * @param props.breakpoints - Forwarded to `LivePreviewPanel` (not rendered while `isMobile`).
 * @param props.form - Forwarded to `LivePreviewPanel`.
 * @returns The bottom-sheet overlay.
 */
export function LivePreviewMobileOverlay(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewUrl: string;
  collectionSlug: string;
  documentId?: string;
  tempId?: string;
  debounceMs?: number;
  breakpoints: LivePreviewBreakpoint[];
  form: AnyFormApi;
}) {
  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        // `top-10` (not the default content-sized `h-auto` alone) leaves the
        // thin strip of the page visible above the sheet; with `bottom-0`
        // already set for `side="bottom"`, a `height: auto` box stretches to
        // fill the gap between the two per CSS's absolute-positioning rules.
        className="top-10 flex h-auto min-h-0 flex-col gap-0 overflow-hidden rounded-t-xl border-t p-0 sm:max-w-none"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Live preview</SheetTitle>
          <SheetDescription>
            Shows how the current form values render on the previewed page.
          </SheetDescription>
        </SheetHeader>
        <LivePreviewPanel
          previewUrl={props.previewUrl}
          collectionSlug={props.collectionSlug}
          documentId={props.documentId}
          tempId={props.tempId}
          debounceMs={props.debounceMs}
          breakpoints={props.breakpoints}
          form={props.form}
          isMobile
          onClose={() => props.onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
