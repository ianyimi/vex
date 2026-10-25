import { AdminDataField } from "@vexcms/core";
import { Label } from "../ui";
import { type ComponentPropsWithRef, createContext, useContext } from "react";
import { cn } from "../../styles/utils";

/**
 * When `true`, `FormLabel` stays in the accessibility tree but is visually
 * hidden — `FormArray` sets it around a plain (non-group) item's input, whose
 * number already sits in the row's gutter, so the controls line up with the
 * input instead of the label-plus-input stack.
 */
export const HideFieldLabelContext = createContext(false);

// eslint-disable-next-line jsdoc/require-jsdoc
export function FormLabel({
  name,
  field,
  index,
  hideRequired = false,
  id = `${name}-label`,
  className,
  ...labelProps
}: {
  name: string;
  field: AdminDataField;
  index?: number;
  hideRequired?: boolean;
} & ComponentPropsWithRef<"label">) {
  const hidden = useContext(HideFieldLabelContext);
  const label = field.label || name;
  const numeric = index !== undefined ? `[${index + 1}] - ` : "";
  return (
    <Label
      id={id}
      htmlFor={name}
      className={cn(hidden ? "sr-only" : "relative", className)}
      {...labelProps}
    >
      {numeric}
      {label}
      {!hideRequired && field.required && (
        <span className="text-red-500">*</span>
      )}
    </Label>
  );
}
