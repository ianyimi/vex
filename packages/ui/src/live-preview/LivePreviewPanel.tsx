"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import type { LivePreviewBreakpoint } from "@vexcms/core";
import { DEFAULT_BREAKPOINTS } from "@vexcms/core";
import { BreakpointSelector } from "./BreakpointSelector";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "../components/ui/button";

/**
 * Side panel that embeds a preview iframe with breakpoint controls.
 *
 * @param props.config - The collection's livePreview config
 * @param props.doc - Current document data (used for URL resolution)
 * @param props.adminBreakpoints - Global admin breakpoints (fallback)
 */
export function LivePreviewPanel(props: {
  /** Resolved preview URL, or a function that receives the doc and returns a URL */
  url: string | ((doc: { _id: string; [key: string]: any }) => string);
  doc: { _id: string; [key: string]: any };
  breakpoints?: LivePreviewBreakpoint[];
  adminBreakpoints?: LivePreviewBreakpoint[];
}) {
  const breakpoints = props.breakpoints ?? props.adminBreakpoints ?? DEFAULT_BREAKPOINTS;

  const [selectedBreakpoint, setSelectedBreakpoint] = useState<LivePreviewBreakpoint | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(`vex-preview-bp-${props.doc._id}`);
    if (!stored) return null;
    return breakpoints.find((bp) => bp.label === stored) ?? null;
  });

  const [iframeKey, setIframeKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previousURL, setPreviousURL] = useState<string | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Resolve URL
  const previewURL = useMemo(() => {
    try {
      let url: string;
      if (typeof props.url === "function") {
        url = props.url(props.doc);
      } else {
        url = props.url;
      }
      if (!url) {
        throw new Error(`Live preview URL resolved to empty string for document ${props.doc._id}`);
      }
      setError(null);
      setPreviousURL(url);
      return url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to resolve preview URL");
      return previousURL ?? null;
    }
  }, [props.url, props.doc, previousURL]);

  // Track container size for scaling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Persist breakpoint selection
  const handleBreakpointSelect = useCallback(
    (bp: LivePreviewBreakpoint | null) => {
      setSelectedBreakpoint(bp);
      if (bp) {
        localStorage.setItem(`vex-preview-bp-${props.doc._id}`, bp.label);
      } else {
        localStorage.removeItem(`vex-preview-bp-${props.doc._id}`);
      }
    },
    [props.doc._id],
  );

  // Compute iframe dimensions and scale
  const iframeStyle = useMemo(() => {
    if (!selectedBreakpoint) {
      return { width: "100%", height: "100%", transform: "none", transformOrigin: "top left" as const };
    }

    const { width, height } = selectedBreakpoint;
    const scaleX = containerSize.width > 0 ? Math.min(1, containerSize.width / width) : 1;
    const scaleY = containerSize.height > 0 ? Math.min(1, containerSize.height / height) : 1;
    const scale = Math.min(scaleX, scaleY);

    return {
      width: `${width}px`,
      height: `${height}px`,
      transform: scale < 1 ? `scale(${scale})` : "none",
      transformOrigin: "top left" as const,
    };
  }, [selectedBreakpoint, containerSize]);

  if (error && !previewURL) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIframeKey((k) => k + 1)}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="shrink-0 border-b px-3 py-2 flex items-center justify-between">
        <BreakpointSelector
          breakpoints={breakpoints}
          selected={selectedBreakpoint?.label ?? null}
          onSelect={handleBreakpointSelect}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIframeKey((k) => k + 1)}
          title="Refresh preview"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Iframe container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden bg-muted/30 flex items-start justify-center p-2"
      >
        {previewURL ? (
          <iframe
            key={iframeKey}
            src={previewURL}
            style={iframeStyle}
            className="border bg-white rounded shadow-sm"
            title="Live preview"
          />
        ) : (
          <p className="text-sm text-muted-foreground mt-8">Save to enable preview</p>
        )}
      </div>
    </div>
  );
}
