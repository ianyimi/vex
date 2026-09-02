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
  const rawError = field.state.meta.errors[0];
  // TanStack Form v1 stores Standard Schema issue objects in errors[], not
  // strings. Extract .message when the error is an object (Zod v4 issues have
  // { origin, code, minimum, inclusive, path, message }).
  const errorMessage =
    typeof rawError === "string"
      ? rawError
      : (rawError as { message?: string } | undefined)?.message;

  const showError =
    (field.state.meta.isTouched || submissionAttempts > 0) && errorMessage;

  return (
    <Activity mode={showError ? "visible" : "hidden"}>
      <p
        className={cn("text-[0.8rem] text-destructive", className)}
        {...pProps}
      >
        {errorMessage}
      </p>
    </Activity>
  );
}
