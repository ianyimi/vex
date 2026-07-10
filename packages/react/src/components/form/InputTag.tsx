import { ComponentPropsWithRef } from "react";
import { cn } from "../../styles/utils";
import { Button } from "../ui";

export function InputTag({ children, className }: ComponentPropsWithRef<"div">) {
  return (
    <Button variant="outline" disabled className={cn("text-xs font-mono px-2", className)}>
      {children}
    </Button>
  );
}
