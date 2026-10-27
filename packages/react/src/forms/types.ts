"use client";

import type { ReactNode } from "react";
import type {
  FormAsyncValidateOrFn,
  FormValidateOrFn,
  ReactFormExtendedApi,
} from "@tanstack/react-form";

/**
 * Opaque form API type — generics erased at the context boundary.
 *
 * `useAppForm` returns `ReactFormExtendedApi` (= `FormApi` & `ReactFormApi`), which
 * adds the `Field`/`AppField`/`Subscribe`/`FormGroup` methods `@tanstack/react-form`'s
 * own bare `AnyFormApi` (re-exported from `@tanstack/form-core`) lacks. Using `any` for
 * every generic lets a consumer hold any form instance regardless of its `TFormData` shape.
 */
export type AnyFormApi<
  TFormData extends any = any,
  TOnMount extends undefined | FormValidateOrFn<TFormData> = undefined | FormValidateOrFn<TFormData>,
  TOnChange extends undefined | FormValidateOrFn<TFormData> = undefined | FormValidateOrFn<TFormData>,
  TOnChangeAsync extends undefined | FormAsyncValidateOrFn<TFormData> = undefined | FormAsyncValidateOrFn<TFormData>,
  TOnBlur extends undefined | FormValidateOrFn<TFormData> = undefined | FormValidateOrFn<TFormData>,
  TOnBlurAsync extends undefined | FormAsyncValidateOrFn<TFormData> = undefined | FormAsyncValidateOrFn<TFormData>,
  TOnSubmit extends undefined | FormValidateOrFn<TFormData> = undefined | FormValidateOrFn<TFormData>,
  TOnSubmitAsync extends undefined | FormAsyncValidateOrFn<TFormData> = undefined | FormAsyncValidateOrFn<TFormData>,
  TOnDynamic extends undefined | FormValidateOrFn<TFormData> = undefined | FormValidateOrFn<TFormData>,
  TOnDynamicAsync extends undefined | FormAsyncValidateOrFn<TFormData> = undefined | FormAsyncValidateOrFn<TFormData>,
  TOnServer extends undefined | FormAsyncValidateOrFn<TFormData> = undefined | FormAsyncValidateOrFn<TFormData>,
  TSubmitMeta extends any = any,
> = ReactFormExtendedApi<
  TFormData,
  TOnMount,
  TOnChange,
  TOnChangeAsync,
  TOnBlur,
  TOnBlurAsync,
  TOnSubmit,
  TOnSubmitAsync,
  TOnDynamic,
  TOnDynamicAsync,
  TOnServer,
  TSubmitMeta
>;

/**
 * Props a `renderControl` override receives in place of a form field's
 * default `ui/` control. Matches the `admin.components.Input` override
 * contract (decision 5, core `fields/types.ts` `FieldControlProps` — same
 * shape, declared independently here since this entry never imports
 * `@vexcms/core`'s field-definition types).
 */
export interface FieldControlProps<TValue = unknown> {
  /** The control's DOM id — the form field's `<label htmlFor>` already points at this. */
  id: string;
  /** The field's current value. */
  value: TValue;
  /** Commits a new value to the form. */
  onChange: (value: TValue) => void;
  /** Marks the field touched — drives `FormFieldLayout`'s error timing. */
  onBlur: () => void;
  /** Whether the control must reject edits. */
  readOnly: boolean;
  /** Whether `FormFieldLayout` is currently showing a validation error for this field. */
  invalid: boolean;
  /** The control's `aria-describedby` value — joins `FormFieldLayout`'s description/error ids for this field's `id`; `undefined` when neither applies. See {@link fieldDescribedBy}. */
  describedBy: string | undefined;
}
/** Renders a form field's control in place of its default `ui/` control. */
export type RenderControl<TValue = unknown> = (props: FieldControlProps<TValue>) => ReactNode;

/**
 * Props every app form field component accepts beneath its value-specific
 * props — plain data only, lifted from what each admin `Input.tsx` used to
 * read off `fieldDef` (`fieldDef.label`, `.description`, `.required`,
 * `.admin.readOnly`).
 */
export interface BaseFormFieldProps<TValue = unknown> {
  /** Rendered by `FormFieldLayout`; omit to render no label block (e.g. `CheckboxField`'s inline label). */
  label?: string;
  /** Rendered by `FormFieldLayout` under the label, above the control; hidden when absent. */
  description?: string;
  /** Shows the `FormFieldLayout` required marker and sets `aria-required` on the default control. */
  required?: boolean;
  /** Forwarded to the default control's `disabled`/`readOnly`, and to a `renderControl` override. */
  readOnly?: boolean;
  /** Array-item position — `FormFieldLayout` renders it as the `[n] -` label prefix. */
  index?: number;
  /** Replaces the default `ui/` control; see {@link RenderControl}. */
  renderControl?: RenderControl<TValue>;
  /** Rendered by `FormFieldLayout` before the control. */
  before?: ReactNode;
  /** Rendered by `FormFieldLayout` after the control, above the error/counter footer row. */
  after?: ReactNode;
  /** Forwarded to `FormFieldLayout`'s outer element. */
  className?: string;
}
