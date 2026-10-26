"use client";

import type { AnyFieldApi } from "@tanstack/react-form";
import { Activity, createContext, useContext, type ReactNode } from "react";
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from "../ui/field";
import { cn } from "../utils/cn";

/**
 * When `true`, `FormFieldLayout`'s own label stays in the accessibility
 * tree but is rendered visually hidden (`sr-only`) — an array item's
 * primitive control sets this around its input, whose index number already
 * sits in the row's gutter, so the row's controls line up with the input's
 * height instead of the label-plus-input stack. Never hides a field's
 * description or error text, only the label. Defaults to `false` (label
 * shown); ported from the deleted `components/form/FormLabel.tsx`'s
 * `HideFieldLabelContext`.
 */
export const HideFieldLabelContext = createContext(false);

/**
 * Extracts a field's current validation-error message, if any. TanStack Form
 * v1 stores Standard Schema issue objects in `errors[]`, not strings — this
 * reads `.message` when the error is an object (Zod v4 issues carry
 * `{ origin, code, minimum, inclusive, path, message }`).
 *
 * Moved in unchanged from the deleted `components/form/FormError.tsx`.
 *
 * @param field - The field whose current error message to extract.
 * @returns The error message, or `undefined` if the field has no error.
 */
function getFieldErrorMessage(field: AnyFieldApi): string | undefined {
  const rawError = field.state.meta.errors[0];
  return typeof rawError === "string"
    ? rawError
    : (rawError as { message?: string } | undefined)?.message;
}

/**
 * Whether a field should currently present as invalid — touched or a
 * submission has been attempted, and a real error is present. Every app form
 * field uses this both for `FormFieldLayout`'s own error text and for the
 * `invalid` flag a `renderControl` override receives, so the control's
 * `aria-invalid` and the visible message stay in lockstep.
 *
 * @param props.field - The field to check.
 * @param props.submissionAttempts - `useFormContext().store.state.submissionAttempts`.
 * @returns `true` if the field's error should currently be shown.
 */
export function isFieldShowingError(props: {
  field: AnyFieldApi;
  submissionAttempts: number;
}): boolean {
  const errorMessage = getFieldErrorMessage(props.field);
  return Boolean(
    (props.field.state.meta.isTouched || props.submissionAttempts > 0) && errorMessage,
  );
}

/**
 * The `aria-describedby` value a form field's control should receive —
 * joins the description and error ids `FormFieldLayout` renders for `id`,
 * omitting whichever one does not apply. Exported so field components can
 * build the same ids for their `FieldControlProps.describedBy` before
 * `FormFieldLayout` itself renders — the control is `FormFieldLayout`'s
 * `children`, built by its caller, so `aria-invalid`/`aria-describedby` land
 * on the control itself rather than the `role="group"` wrapper.
 *
 * @param props.id - The field's DOM id.
 * @param props.hasDescription - Whether `FormFieldLayout` will render a description.
 * @param props.showError - Whether `FormFieldLayout` will render the error (see {@link isFieldShowingError}).
 * @returns The joined id string, or `undefined` when neither applies.
 */
export function fieldDescribedBy(props: {
  id: string;
  hasDescription: boolean;
  showError: boolean;
}): string | undefined {
  const descriptionId = props.hasDescription ? `${props.id}-description` : null;
  const errorId = props.showError ? `${props.id}-error` : null;
  return [descriptionId, errorId].filter((id): id is string => id !== null).join(" ") || undefined;
}

/**
 * The layout every app form field renders its control inside: label with
 * required marker and `[n] -` index prefix, the control (`children`),
 * optional `before`/`after` nodes flanking it, description, and the
 * validation error — built on `components/ui/field.tsx`'s shadcn field
 * primitives.
 *
 * @param props.id - The control's DOM id; the label's `htmlFor` target.
 * @param props.label - Label text. No label block renders when omitted.
 * @param props.required - Shows the `*` marker beside the label.
 * @param props.description - Helper text rendered under the control.
 * @param props.index - Array-item position, rendered as `[n] -` before the label.
 * @param props.field - The field whose error state to render.
 * @param props.submissionAttempts - Drives {@link isFieldShowingError}'s timing.
 * @param props.before - Rendered immediately before `children`.
 * @param props.after - Rendered immediately after `children`.
 * @param props.children - The control.
 * @param props.className - Additional classes on the outer `Field`.
 * @returns The field's label/control/description/error stack.
 */
export function FormFieldLayout(props: {
  id: string;
  label?: string;
  required?: boolean;
  description?: string;
  index?: number;
  field: AnyFieldApi;
  submissionAttempts: number;
  before?: ReactNode;
  after?: ReactNode;
  children: ReactNode;
  className?: string;
}): ReactNode {
  const errorMessage = getFieldErrorMessage(props.field);
  const showError = isFieldShowingError({
    field: props.field,
    submissionAttempts: props.submissionAttempts,
  });
  const descriptionId = `${props.id}-description`;
  const errorId = `${props.id}-error`;
  const labelHidden = useContext(HideFieldLabelContext);

  return (
    <Field className={props.className} data-invalid={showError}>
      {props.label !== undefined && (
        <FieldLabel
          htmlFor={props.id}
          id={`${props.id}-label`}
          className={cn(labelHidden && "sr-only")}
        >
          {props.index !== undefined ? `[${props.index + 1}] - ` : ""}
          {props.label}
          {props.required && <span className="text-red-500">*</span>}
        </FieldLabel>
      )}
      <FieldContent>
        {props.before}
        {props.children}
        {props.after}
        <Activity mode={props.description ? "visible" : "hidden"}>
          <FieldDescription id={descriptionId} data-slot="form-description">
            {props.description}
          </FieldDescription>
        </Activity>
        {showError && (
          <FieldError id={errorId} role="alert">
            {errorMessage}
          </FieldError>
        )}
      </FieldContent>
    </Field>
  );
}
