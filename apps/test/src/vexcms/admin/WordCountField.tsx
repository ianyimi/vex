"use client";

import type { UIFieldComponentProps } from "@vexcms/core";

import { TABLE_SLUG_PAGES } from "~/db/constants";

/** Live word count of the page's `content` field — dogfoods `ui()` (Step 6): no stored value, read-only derived display. */
export function WordCountField(props: UIFieldComponentProps<typeof TABLE_SLUG_PAGES>) {
  const content = typeof props.data.content === "string" ? props.data.content : "";
  const words = content.trim().length === 0 ? 0 : content.trim().split(/\s+/).length;
  return (
    <p className="text-sm text-muted-foreground">
      {props.name}: {words} word{words === 1 ? "" : "s"}
    </p>
  );
}
