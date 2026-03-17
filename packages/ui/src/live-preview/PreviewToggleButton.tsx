"use client";

import { Eye, EyeOff } from "lucide-react";
import { Button } from "../components/ui/button";

/**
 * Button in the document toolbar to toggle the live preview panel.
 *
 * @param props.isOpen - Whether the preview panel is currently visible
 * @param props.onToggle - Callback to toggle visibility
 */
export function PreviewToggleButton(props: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={props.onToggle}
      title={props.isOpen ? "Hide preview" : "Show preview"}
    >
      {props.isOpen ? (
        <EyeOff className="h-4 w-4 mr-2" />
      ) : (
        <Eye className="h-4 w-4 mr-2" />
      )}
      Preview
    </Button>
  );
}
