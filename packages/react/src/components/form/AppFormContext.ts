"use client";

import type {
  FormAsyncValidateOrFn,
  FormValidateOrFn,
  ReactFormExtendedApi,
} from "@tanstack/react-form";
import { createContext, useContext } from "react";

/**
 * Opaque form API type — generics erased at the context boundary.
 *
 * `useForm` returns `ReactFormExtendedApi` (= `FormApi & ReactFormApi`), which
 * adds the `Field` render-prop component. Using `any` for all generics lets the
 * context hold any form instance regardless of its `TFormData` shape.
 */
export type AnyFormApi<
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
 * React context that distributes the TanStack Form instance to descendant field
 * input components.
 *
 * Provided by `<AppForm>`. Field inputs built with `createFieldInput` read this
 * context when no explicit `field` prop is passed.
 *
 * @see {@link AppForm} for the provider component
 * @see {@link useAppForm} for the consuming hook
 * @see {@link createFieldInput} for the factory that reads this context
 */
export const AppFormContext = createContext<AnyFormApi<
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any
> | null>(null);

/**
 * Returns the current TanStack Form instance from the nearest `<AppForm>`.
 *
 * @returns The form instance.
 * @throws {Error} When called outside of `<AppForm>`.
 *
 * @see {@link AppFormContext}
 */
export function useAppForm<TFormData extends any = any>(): AnyFormApi<
  TFormData,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any
> {
  const form = useContext(AppFormContext);
  if (!form) throw new Error("useAppForm must be called inside <AppForm>");
  return form;
}
