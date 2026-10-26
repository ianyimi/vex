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
 * The layout every app form field renders its control inside: label (with
 * required marker and `[n] -` index prefix), description, the control
 * (`children`), optional `before`/`after` nodes flanking it, and the
 * validation error — built on `components/ui/field.tsx`'s shadcn field
 * primitives. Order is label → description → control → `after` → the
 * counter/error footer row; the description sits directly under the
 * label, above the control, not below it.
 *
 * Spacing is margin-driven, not a single container `gap`: 4px label→
 * description, 8px label-or-description→control, 4px control→`after`→
 * the footer row — each applied only when its predecessor actually
 * renders, so a `sr-only` label (`HideFieldLabelContext`) or a hidden
 * (`<Activity mode="hidden">`) description never contributes a gap.
 *
 * `counter` and the validation error share one row directly under the
 * control (4px below it): the error (when showing) takes the remaining
 * width and wraps; `counter` stays right-aligned and never gets pushed
 * away from the control by a wrapping error. When there is no error,
 * `counter` still right-aligns alone in that row.
 *
 * @param props.id - The control's DOM id; the label's `htmlFor` target.
 * @param props.label - Label text. No label block renders when omitted.
 * @param props.labelContent - Replaces the default label markup entirely
 * (e.g. a label row with a trailing action button) while still occupying
 * the label's position and spacing. Takes precedence over `label`.
 * @param props.required - Shows the `*` marker beside the label.
 * @param props.description - Helper text rendered under the label, above the control.
 * @param props.index - Array-item position, rendered as `[n] -` before the label.
 * @param props.field - The field whose error state to render.
 * @param props.submissionAttempts - Drives {@link isFieldShowingError}'s timing.
 * @param props.before - Rendered immediately before `children`.
 * @param props.after - Rendered on its own line after the control, above the counter/error footer row.
 * @param props.counter - Rendered in the footer row, right-aligned beside the validation error.
 * @param props.children - The control.
 * @param props.className - Additional classes on the outer `Field`.
 * @returns The field's label/description/control/error stack.
 */
export function FormFieldLayout(props: {
  id: string;
  label?: string;
  labelContent?: ReactNode;
  required?: boolean;
  description?: string;
  index?: number;
  field: AnyFieldApi;
  submissionAttempts: number;
  before?: ReactNode;
  after?: ReactNode;
  counter?: ReactNode;
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
  const hasLabel = props.labelContent !== undefined || props.label !== undefined;
  const hasDescription = Boolean(props.description);

  const labelNode =
    props.labelContent ??
    (props.label !== undefined && (
      <FieldLabel
        htmlFor={props.id}
        id={`${props.id}-label`}
        className={cn(labelHidden && "sr-only")}
      >
        {props.index !== undefined ? `[${props.index + 1}] - ` : ""}
        {props.label}
        {props.required && <span className="text-red-500">*</span>}
      </FieldLabel>
    ));

  return (
    <Field className={props.className} data-invalid={showError}>
      {hasLabel && labelNode}
      <Activity mode={hasDescription ? "visible" : "hidden"}>
        <FieldDescription
          id={hasDescription ? descriptionId : undefined}
          data-slot="form-description"
          className={cn(hasLabel && !labelHidden && "mt-1")}
        >
          {props.description}
        </FieldDescription>
      </Activity>
      <FieldContent className={cn((hasDescription || (hasLabel && !labelHidden)) && "mt-2")}>
        {props.before}
        {props.children}
        {props.after}
        {(showError || props.counter) && (
          <div className="flex flex-wrap items-start gap-x-2 gap-y-1" data-slot="field-footer">
            {showError && (
              <FieldError id={errorId} role="alert" className="min-w-0 flex-1">
                {errorMessage}
              </FieldError>
            )}
            {props.counter && <span className="ml-auto shrink-0">{props.counter}</span>}
          </div>
        )}
      </FieldContent>
    </Field>
  );
}
