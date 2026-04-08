import { TypedFieldApi } from "./createFieldInput";
import { Activity, ComponentPropsWithRef } from "react";
import { cn } from "../../styles/utils";

// eslint-disable-next-line jsdoc/require-jsdoc
export function FormError({
  field,
  submissionAttempts,
  className,
  ...pProps
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field: TypedFieldApi<any>;
  submissionAttempts: number;
} & ComponentPropsWithRef<"p">) {
  const showError =
    (field.state.meta.isTouched || submissionAttempts > 0) &&
    field.state.meta.errors[0];

  return (
    <Activity mode={showError ? "visible" : "hidden"}>
      <p
        className={cn("text-[0.8rem] text-destructive", className)}
        {...pProps}
      >
        {field.state.meta.errors[0]}
      </p>
    </Activity>
  );
}
