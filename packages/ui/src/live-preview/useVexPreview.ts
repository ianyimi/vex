"use client";

import { useEffect, useRef } from "react";

/**
 * Message type sent from preview iframe to admin panel.
 */
export const VEX_PREVIEW_UPDATED = "vex:preview-updated" as const;

interface VexPreviewMessage {
  type: typeof VEX_PREVIEW_UPDATED;
}

/**
 * Hook for preview pages rendered inside the admin's live preview iframe.
 * Call this in your preview page component, passing the query data.
 * When the data changes, it notifies the admin panel via postMessage
 * so the syncing spinner stops.
 *
 * @param props.data - The reactive query data. When this changes, a message is sent.
 *
 * @example
 * ```tsx
 * // app/posts/[postId]/page.tsx
 * import { useVexPreview } from "@vexcms/ui";
 *
 * export default function PostPage() {
 *   const post = useQuery(api.vex.api.posts.get, { id: postId, _vexDrafts: "snapshot" });
 *   useVexPreview({ data: post });
 *
 *   return <div>{post?.title}</div>;
 * }
 * ```
 */
export function useVexPreview(props: { data: unknown }) {
  const prevRef = useRef<string | undefined>(undefined);
  const isInIframe = typeof window !== "undefined" && window.parent !== window;

  useEffect(() => {
    if (!isInIframe) return;
    if (props.data === undefined) return; // still loading

    const serialized = JSON.stringify(props.data);
    if (serialized !== prevRef.current) {
      prevRef.current = serialized;
      // Notify parent on every data change, including initial load.
      // This acks the admin panel's syncing state.
      window.parent.postMessage(
        { type: VEX_PREVIEW_UPDATED } satisfies VexPreviewMessage,
        "*",
      );
    }
  }, [props.data, isInIframe]);
}
