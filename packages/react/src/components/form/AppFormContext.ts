"use client";

import type { ReactFormExtendedApi } from "@tanstack/react-form";
import { createContext, useContext } from "react";

/**
 * Opaque form API type — generics erased at the context boundary.
 *
 * `useForm` returns `ReactFormExtendedApi` (= `FormApi & ReactFormApi`), which
 * adds the `Field` render-prop component. Using `any` for all generics lets the
 * context hold any form instance regardless of its `TFormData` shape.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyFormApi = ReactFormExtendedApi<any, any>;

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
export const AppFormContext = createContext<AnyFormApi | null>(null);

/**
 * Returns the current TanStack Form instance from the nearest `<AppForm>`.
 *
 * @returns The form instance.
 * @throws {Error} When called outside of `<AppForm>`.
 *
 * @see {@link AppFormContext}
 */
export function useAppForm(): AnyFormApi {
  const form = useContext(AppFormContext);
  if (!form) throw new Error("useAppForm must be called inside <AppForm>");
  return form;
}
