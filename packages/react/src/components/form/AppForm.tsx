"use client";

import type { ReactNode } from "react";
import { AppFormContext, type AnyFormApi } from "./AppFormContext";
import { DndProvider } from "../ui/dnd";
import { FormAsyncValidateOrFn, FormValidateOrFn } from "@tanstack/react-form";

/**
 * Provides a TanStack Form instance to all descendant field input components.
 *
 * Wrap any set of `TextFieldInput` (or other field input) components in `<AppForm>`
 * and they will read the form from context — no prop threading needed.
 *
 * The `name` prop on each input must match the corresponding key in `form.defaultValues`.
 *
 * @param props - Component props.
 * @param props.form - The TanStack Form instance created by `useForm`. Provided to all
 *   descendant field input components via `AppFormContext`.
 * @param props.children - Field input components and any other form content (submit button, etc.).
 * @param props.className - Optional CSS class applied to the `<form>` element.
 * @returns A `<form>` element wrapped in `AppFormContext.Provider`, distributing the form
 *   instance to all descendant field input components.
 * @example
 * ```tsx
 * const form = useForm({ defaultValues: { title: "", slug: "" } })
 *
 * <AppForm form={form}>
 *   <TextFieldInput name="title" fieldDef={titleField} readOnly={false} />
 *   <TextFieldInput name="slug"  fieldDef={slugField}  readOnly={false} />
 * </AppForm>
 * ```
 */
export function AppForm<
  TFormData extends any = any,
  TOnMount extends undefined | FormValidateOrFn<TFormData> = undefined,
  TOnChange extends undefined | FormValidateOrFn<TFormData> = undefined,
  TOnChangeAsync extends undefined | FormAsyncValidateOrFn<TFormData> = undefined,
  TOnBlur extends undefined | FormValidateOrFn<TFormData> = undefined,
  TOnBlurAsync extends undefined | FormAsyncValidateOrFn<TFormData> = undefined,
  TOnSubmit extends undefined | FormValidateOrFn<TFormData> = undefined,
  TOnSubmitAsync extends undefined | FormAsyncValidateOrFn<TFormData> = undefined,
  TOnDynamic extends undefined | FormValidateOrFn<TFormData> = undefined,
  TOnDynamicAsync extends undefined | FormAsyncValidateOrFn<TFormData> = undefined,
  TOnServer extends undefined | FormAsyncValidateOrFn<TFormData> = undefined,
  TSubmitMeta extends any = any,
>(props: {
  form: AnyFormApi<
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
  children: ReactNode;
  className?: string;
}) {
  return (
    <AppFormContext.Provider value={props.form}>
      <DndProvider>
        <form
          className={props.className}
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            props.form.handleSubmit();
          }}
        >
          {props.children}
        </form>
      </DndProvider>
    </AppFormContext.Provider>
  );
}
