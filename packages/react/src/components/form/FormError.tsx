import { TypedFieldApi } from "./createFieldInput";
import { Activity, ComponentPropsWithRef } from "react";
import { cn } from "../../styles/utils";

/**
 * Extracts a field's current validation-error message, if any. TanStack Form
 * v1 stores Standard Schema issue objects in `errors[]`, not strings — this
 * reads `.message` when the error is an object (Zod v4 issues carry
 * `{ origin, code, minimum, inclusive, path, message }`).
 *
 * @param field - The field whose current error message to extract.
 * @returns The error message, or `undefined` if the field has no error.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getFieldErrorMessage(field: TypedFieldApi<any>): string | undefined {
  const rawError = field.state.meta.errors[0];
  return typeof rawError === "string"
    ? rawError
    : (rawError as { message?: string } | undefined)?.message;
}

/**
 * Whether a field should currently present as invalid — touched or a
 * submission has been attempted, and a real error is present. The exact
 * timing `FormError` uses to decide whether to render its message; field
 * inputs call this to set `aria-invalid` on their control so the control's
 * own destructive-ring styling (`ui/input.tsx`, `ui/checkbox.tsx`,
 * `ui/button.tsx`, `ui/multi-select.tsx`) activates in lockstep with the
 * visible message, rather than the message being the only signal.
 *
 * @returns `true` if the field's error should currently be shown.
 */
export function isFieldShowingError(props: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field: TypedFieldApi<any>;
  submissionAttempts: number;
}): boolean {
  const errorMessage = getFieldErrorMessage(props.field);
  return Boolean(
    (props.field.state.meta.isTouched || props.submissionAttempts > 0) &&
    errorMessage,
  );
}

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
  const errorMessage = getFieldErrorMessage(field);
  const showError = isFieldShowingError({ field, submissionAttempts });

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
