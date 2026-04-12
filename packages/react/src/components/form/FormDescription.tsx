import { AdminField } from "@vexcms/core";
import { Activity, ComponentPropsWithRef } from "react";
import { cn } from "../../styles/utils";

// eslint-disable-next-line jsdoc/require-jsdoc
export function FormDescription({
  field,
  className,
  ...pProps
}: {
  field: AdminField;
} & ComponentPropsWithRef<"p">) {
  return (
    <Activity mode={field.description ? "visible" : "hidden"}>
      <p
        className={cn("text-[0.8rem] text-muted-foreground", className)}
        {...pProps}
      >
        {field.admin.description}
      </p>
    </Activity>
  );
}
