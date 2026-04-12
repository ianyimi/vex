import { AdminField } from "@vexcms/core";
import { Label } from "../ui";
import { ComponentPropsWithRef } from "react";
import { cn } from "../../styles/utils";

// eslint-disable-next-line jsdoc/require-jsdoc
export function FormLabel({
  name,
  field,
  hideRequired = false,
  className,
  ...labelProps
}: {
  name: string;
  field: AdminField;
  hideRequired?: boolean;
} & ComponentPropsWithRef<"label">) {
  return (
    <Label htmlFor={name} className={cn("relative", className)} {...labelProps}>
      {field.label || name}
      {!hideRequired && field.required && (
        <span className="text-red-500">*</span>
      )}
    </Label>
  );
}
