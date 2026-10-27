"use client";

import type { EditSlotProps } from "@vexcms/core";
import { useVexDocument } from "@vexcms/react";
import type { ComponentType } from "react";

interface SaveWithAnalyticsProps extends EditSlotProps {
  renderDefault: ComponentType<EditSlotProps>;
}

/**
 * Wraps `vex.save` in `edit.header.overrides` on `posts` — logs a
 * console event naming the document before delegating to the real Save
 * button via `renderDefault`. Exists to dogfood decision 15's per-built-in
 * `overrides` map, not as a real analytics integration.
 */
export function SaveWithAnalytics(props: SaveWithAnalyticsProps) {
  const document = useVexDocument();
  const RenderDefault = props.renderDefault;

  return (
    <span
      onClickCapture={() => {
        console.info(`[test] saving ${document.kind}:${document.slug}${document.id ? `/${document.id}` : ""}`);
      }}
    >
      <RenderDefault {...props} />
    </span>
  );
}
