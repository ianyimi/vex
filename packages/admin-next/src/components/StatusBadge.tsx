"use client";

import { Badge } from "@vexcms/ui";

/**
 * Renders a badge indicating document draft/published status.
 * Used in the list view _status column and edit view header.
 */
export function StatusBadge(props: {
  status: "draft" | "published" | string;
}) {
  if (props.status === "published") {
    return (
      <Badge variant="default" className="bg-green-600 hover:bg-green-600 text-white text-xs">
        Published
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="text-xs">
      Draft
    </Badge>
  );
}
