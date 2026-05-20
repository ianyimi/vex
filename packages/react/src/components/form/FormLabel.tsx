import { AdminField } from "@vexcms/core";
import { Label } from "../ui";
import { ComponentPropsWithRef } from "react";
import { cn } from "../../styles/utils";

// eslint-disable-next-line jsdoc/require-jsdoc
export function FormLabel({
  name,
  field,
  index,
  hideRequired = false,
  className,
  ...labelProps
}: {
  name: string;
  field: AdminField;
  index?: number;
  hideRequired?: boolean;
} & ComponentPropsWithRef<"label">) {
  const label = field.label || name;
  const numeric = index !== undefined ? `[${index + 1}] - ` : "";
  return (
    <Label htmlFor={name} className={cn("relative", className)} {...labelProps}>
      {numeric}
      {label}
      {!hideRequired && field.required && (
        <span className="text-red-500">*</span>
      )}
    </Label>
  );
}
