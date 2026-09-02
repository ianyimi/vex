import { ComponentPropsWithRef } from "react";
import { cn } from "../../styles/utils";
import { Button } from "../ui";

/**
 * Small disabled-button-styled tag, used to label a value inline (e.g. the
 * "ALT" badge next to an upload's alt-text preview).
 *
 * @param props - Standard `<div>` props; `children` is the tag's label content.
 * @returns A disabled outline button styled as a small monospace tag.
 */
export function InputTag({ children, className }: ComponentPropsWithRef<"div">) {
  return (
    <Button variant="outline" disabled className={cn("text-xs font-mono px-2", className)}>
      {children}
    </Button>
  );
}
