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
export type AnyFormApi = ReactFormExtendedApi<any>;

export const AppFormContext = createContext<AnyFormApi | null>(null);

export function useAppForm(): AnyFormApi {
  const form = useContext(AppFormContext);
  if (!form) throw new Error("useAppForm must be called inside <AppForm>");
  return form;
}
