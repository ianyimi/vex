"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import {
  LIVE_PREVIEW_COLLECTION_PARAM,
  LIVE_PREVIEW_ID_PARAM,
  LIVE_PREVIEW_QUERY_PARAM,
  type LivePreviewBreakpoint,
  type LivePreviewUrlResolver,
} from "@vexcms/core";
import { Loader2 } from "lucide-react";
import type { AnyFormApi } from "../form/AppFormContext";
import { useLivePreviewSync } from "../../hooks/useLivePreviewSync";
import { Button, Icon, VexLink } from "../ui";
import { cn } from "../../styles/utils";

const BREAKPOINT_STORAGE_PREFIX = "vex-live-preview-breakpoint:";

/**
 * Resolves a stored breakpoint width back to one of the configured breakpoints.
 *
 * @param props.breakpoints - The breakpoints this panel offers.
 * @param props.storedWidth - Width read from storage, or `null` for full width.
 * @returns The matching breakpoint, or `null` for full width and for a width
 *   no longer configured.
 */
export function resolveStoredLivePreviewBreakpoint(props: {
  breakpoints: LivePreviewBreakpoint[];
  storedWidth: number | null;
}): LivePreviewBreakpoint | null {
  if (props.storedWidth === null) return null;
  return props.breakpoints.find((breakpoint) => breakpoint.width === props.storedWidth) ?? null;
}

/**
 * The selected simulated width, persisted per collection or global.
 *
 * Held outside the component's lifetime because the panel unmounts every time
 * the editor hides the preview, which would otherwise drop the selection.
 *
 * @param props.slug - Scopes the stored selection.
 * @param props.breakpoints - The breakpoints this panel offers.
 * @returns The selected breakpoint and a setter that persists it.
 */
function useSelectedBreakpoint(props: { slug: string; breakpoints: LivePreviewBreakpoint[] }): [
  LivePreviewBreakpoint | null,
  (breakpoint: LivePreviewBreakpoint | null) => void,
] {
  const storageKey = `${BREAKPOINT_STORAGE_PREFIX}${props.slug}`;
  const [selected, setSelected] = useState<LivePreviewBreakpoint | null>(null);

  // Restored after mount rather than in a `useState` initializer. The admin
  // page is server-rendered, so an initializer that reads `localStorage`
  // produces markup the server never emitted: React keeps the server's
  // attributes on a hydration mismatch, which left the button rendered
  // inactive even though the selection itself had been restored.
  const restoredKey = useRef<string | null>(null);

  useEffect(() => {
    // Once per slug: a new `breakpoints` array identity must not re-run this
    // and clobber the editor's current choice.
    if (restoredKey.current === storageKey) return;
    restoredKey.current = storageKey;

    try {
      const stored = localStorage.getItem(storageKey);
      setSelected(
        resolveStoredLivePreviewBreakpoint({
          breakpoints: props.breakpoints,
          storedWidth: stored === null ? null : Number(stored),
        }),
      );
    } catch {
      // Unreadable storage simply means no remembered selection.
    }
  }, [storageKey, props.breakpoints]);

  const select = (breakpoint: LivePreviewBreakpoint | null) => {
    setSelected(breakpoint);
    try {
      if (breakpoint) {
        localStorage.setItem(storageKey, String(breakpoint.width));
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch {
      // Same guard as the panel's other preferences: a blocked storage write
      // must not take the view down.
    }
  };

  return [selected, select];
}

/** One preview surface's measured pixel size. */
interface LivePreviewContainerSize {
  width: number;
  height: number;
}

/** The iframe's un-scaled box, its CSS scale factor, and its centering offset. */
export interface LivePreviewFrameGeometry {
  width: number;
  height: number;
  scale: number;
  left: number;
}

/**
 * Measures a container element's rendered pixel size via `ResizeObserver`,
 * so the preview surface can compute how much space it actually has —
 * `react-resizable-panels` lays out with percentages/flex, not pixel props,
 * so nothing else tells a child its allotted width.
 *
 * @param containerRef - Ref to the element whose box is measured.
 * @returns Its current pixel width and height, `0` before first measurement.
 */
function useLivePreviewContainerSize(
  containerRef: RefObject<HTMLDivElement | null>,
): LivePreviewContainerSize {
  const [size, setSize] = useState<LivePreviewContainerSize>({ width: 0, height: 0 });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    setSize({ width: element.clientWidth, height: element.clientHeight });

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(element);

    return () => observer.disconnect();
  }, [containerRef]);

  return size;
}

/**
 * Computes the un-scaled iframe dimensions, the CSS `transform: scale(...)`
 * factor, and the horizontal offset needed to center it — pure, so it is
 * fully unit-testable with no DOM.
 *
 * `breakpointWidth: null` ("Full width") passes the container's own size
 * straight through — scale 1, no offset.
 *
 * Otherwise: `scale = min(1, containerWidth / breakpointWidth)`. A narrower
 * breakpoint than the container renders at its real width, centered, with
 * letterboxing on both sides (scale stays 1). A wider breakpoint renders
 * internally at its full width — so the page's own CSS media queries fire
 * exactly as they would at that real device size — visually scaled down to
 * exactly fill the available space.
 *
 * @param props.containerWidth - The panel's measured pixel width.
 * @param props.containerHeight - The panel's measured pixel height.
 * @param props.breakpointWidth - The selected simulated width, or `null` for full width.
 * @returns The iframe's un-scaled box, its scale factor, and its centering offset.
 */
export function computeLivePreviewFrameGeometry(props: {
  containerWidth: number;
  containerHeight: number;
  breakpointWidth: number | null;
}): LivePreviewFrameGeometry {
  if (!props.breakpointWidth || props.containerWidth === 0) {
    return {
      width: props.containerWidth,
      height: props.containerHeight,
      scale: 1,
      left: 0,
    };
  }

  const scale = Math.min(1, props.containerWidth / props.breakpointWidth);
  const scaledWidth = props.breakpointWidth * scale;
  const left = Math.max(0, (props.containerWidth - scaledWidth) / 2);

  return {
    width: props.breakpointWidth,
    height: props.containerHeight / scale,
    scale,
    left,
  };
}

/**
 * The live-preview surface rendered beside (desktop, inside a `ResizablePanel`)
 * or over (mobile, `isMobile`) a collection or global edit form. Renders an
 * iframe pointed at the resolved preview URL and syncs the form's values into
 * it via `useLivePreviewSync`.
 *
 * The header's "Preview" link opens the same URL in a new tab. That tab is
 * reached over `BroadcastChannel` rather than `postMessage` — a
 * `rel="noreferrer"` link leaves no window reference behind — and its mount
 * handshake pulls the current values immediately.
 *
 * @param props.previewUrl - The resolved URL for the CURRENT form values.
 * @param props.collectionSlug - The collection or global slug being previewed.
 * @param props.documentId - The saved document id, once it exists.
 * @param props.tempId - The client-generated temp id, before the first save.
 * @param props.debounceMs - Forwarded to `useLivePreviewSync`.
 * @param props.breakpoints - Toggle-able simulated widths —
 *   `collection.admin.livePreview.breakpoints ?? config.livePreview.breakpoints`,
 *   resolved by the caller. The toggle row is not rendered when `isMobile`.
 * @param props.form - The edit view's form instance, forwarded to `useLivePreviewSync`.
 * @param props.isMobile - Renders `fixed inset-0` full-screen with a close
 *   button instead of filling its parent. Requires `onClose`.
 * @param props.onClose - Required when `isMobile` — called by the close button.
 * @returns The preview surface: toolbar, breakpoint row, and scaled iframe.
 */
export function LivePreviewPanel(props: {
  previewUrl: string;
  collectionSlug: string;
  documentId?: string;
  tempId?: string;
  debounceMs?: number;
  breakpoints: LivePreviewBreakpoint[];
  form: AnyFormApi;
  isMobile?: boolean;
  onClose?: () => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedBreakpoint, setSelectedBreakpoint] = useSelectedBreakpoint({
    slug: props.collectionSlug,
    breakpoints: props.breakpoints,
  });
  // A fresh `previewUrl` means a new navigation: the frame is stale until it
  // reports loaded again, so the placeholder returns instead of showing the
  // previous page's pixels under a new URL.
  const [loadedPreviewUrl, setLoadedPreviewUrl] = useState<string | null>(null);
  const isFrameLoading = loadedPreviewUrl !== props.previewUrl;
  const containerSize = useLivePreviewContainerSize(containerRef);

  useLivePreviewSync({
    form: props.form,
    collectionSlug: props.collectionSlug,
    documentId: props.documentId,
    tempId: props.tempId,
    debounceMs: props.debounceMs,
    // The embedded frame is the only surface this panel holds a reference to.
    // A preview opened from the header link is a `target="_blank"` tab with no
    // opener, so it is reached over `BroadcastChannel` instead — same origin,
    // no reference needed, and its mount handshake pulls the current values
    // immediately rather than waiting for the next keystroke.
    targetWindow: iframeRef.current?.contentWindow ?? null,
  });

  const geometry = computeLivePreviewFrameGeometry({
    containerWidth: containerSize.width,
    containerHeight: containerSize.height,
    breakpointWidth: props.isMobile ? null : (selectedBreakpoint?.width ?? null),
  });

  /**
   * Scrolls the previewed page when the wheel lands on the letterboxing beside
   * a simulated-width frame.
   *
   * A wheel over the iframe itself is delivered to that document directly and
   * never reaches this handler; only the empty margin around a narrow
   * breakpoint does, and doing nothing there reads as a dead zone. Same-origin
   * previews expose `contentWindow.scrollBy`; a cross-origin one (a staging
   * `livePreview.url`) throws on access, so it silently keeps today's
   * behaviour rather than breaking the panel.
   *
   * @param event - The wheel event that landed on the letterboxing.
   */
  function handleLetterboxWheel(event: React.WheelEvent<HTMLDivElement>) {
    try {
      iframeRef.current?.contentWindow?.scrollBy({ top: event.deltaY, behavior: "auto" });
    } catch {
      // Cross-origin preview: nothing we are allowed to scroll from here.
    }
  }

  return (
    <div
      className={
        props.isMobile ? "fixed inset-0 z-50 flex flex-col bg-background" : "flex h-full flex-col"
      }
    >
      <div className="flex items-center justify-between gap-4 px-3 py-2 border-b border-border">
        <VexLink
          href={props.previewUrl}
          target="_blank"
          rel="noreferrer"
          className="truncate flex items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:text-primary"
        >
          Preview
          <Icon name="SquareArrowOutUpRight" size={16} aria-label="Open preview in a new tab" />
        </VexLink>
        {props.isMobile && (
          // A sibling of the link, not a child of it: nested inside, tapping
          // the X followed the href and opened a tab instead of dismissing
          // the full-screen overlay it is the only way out of.
          <Button
            type="button"
            variant="ghost"
            size="icon"
            icon="X"
            aria-label="Close preview"
            onClick={props.onClose}
          />
        )}
        {!props.isMobile && (
          <div className="flex flex-wrap items-center gap-1 px-3">
            {props.breakpoints.map((breakpoint) => {
              const isActive = selectedBreakpoint?.width === breakpoint.width;
              return (
                <Button
                  key={breakpoint.width}
                  type="button"
                  className={cn(
                    "rounded border px-2 py-1 text-xs transition-colors",
                    isActive
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-border bg-muted/40 text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                  title={`${breakpoint.label} (${breakpoint.width}px)`}
                  aria-pressed={isActive}
                  aria-label={`${breakpoint.label} (${breakpoint.width}px)`}
                  onClick={() => setSelectedBreakpoint(isActive ? null : breakpoint)}
                  icon={breakpoint.icon}
                >
                  {breakpoint.label}
                </Button>
              );
            })}
          </div>
        )}
      </div>
      <div
        ref={containerRef}
        onWheel={handleLetterboxWheel}
        className={cn(
          // No padding: this element is the preview surface, and every pixel
          // spent framing it is a pixel the previewed page does not get.
          // `overscroll-contain` stops a wheel that reaches the preview's top
          // or bottom from chaining into the admin behind it.
          "relative min-h-0 flex-1 overscroll-contain",
          !props.isMobile && "overflow-hidden bg-muted/30",
        )}
      >
        <div
          style={{
            position: "absolute",
            left: geometry.left,
            top: 0,
            width: geometry.width,
            height: geometry.height,
            transform: `scale(${geometry.scale})`,
            transformOrigin: "top left",
          }}
        >
          <iframe
            ref={iframeRef}
            src={props.previewUrl}
            className={cn("h-full w-full border-0", isFrameLoading && "invisible")}
            title="Live preview"
            onLoad={() => setLoadedPreviewUrl(props.previewUrl)}
          />
        </div>
        {isFrameLoading && (
          <div
            className="absolute inset-0 flex items-center justify-center gap-2 bg-muted/30"
            role="status"
          >
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Loading preview…</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Resolves the preview URL for the current form values.
 *
 * ALWAYS appends `?vexLivePreview=1`: that param is what the project's
 * middleware gates on before it verifies the session and sets the
 * `vex-live-preview` marker cookie, and what `LivePreviewProvider` then
 * requires to attach a transport listener. A resolver returning a bare public
 * path would otherwise render a perfectly normal page that never listens.
 * Temp-id params are appended on top, only while the document is unsaved.
 *
 * @param props.url - A literal path, or a resolver cast down at the call site
 *   to the loose `LivePreviewUrlResolver` default.
 * @param props.collectionSlug - The collection or global being previewed.
 * @param props.baseDoc - The saved document, or `{}` for one being created.
 * @param props.formValues - The form's complete current values.
 * @param props.tempId - The client-generated temp id for an unsaved document.
 * @returns The preview URL, or `undefined` when it cannot be resolved yet.
 */
export function resolveLivePreviewUrl(props: {
  url: string | LivePreviewUrlResolver | undefined;
  collectionSlug: string;
  baseDoc: Record<string, unknown>;
  formValues: Record<string, unknown>;
  tempId?: string;
}): string | undefined {
  if (!props.url) return undefined;

  const documentId = props.baseDoc._id as string | undefined;
  const previewDoc = {
    ...props.baseDoc,
    ...props.formValues,
    _id: documentId ?? props.tempId,
  };
  const resolvedUrl = typeof props.url === "string" ? props.url : props.url(previewDoc);
  if (!resolvedUrl) return undefined;

  const previewParams = new URLSearchParams({ [LIVE_PREVIEW_QUERY_PARAM]: "1" });
  if (!documentId && props.tempId) {
    previewParams.set(LIVE_PREVIEW_ID_PARAM, props.tempId);
    previewParams.set(LIVE_PREVIEW_COLLECTION_PARAM, props.collectionSlug);
  }

  const querySeparator = resolvedUrl.includes("?") ? "&" : "?";
  return `${resolvedUrl}${querySeparator}${previewParams.toString()}`;
}
