"use client";

import { useContext } from "react";
import { formContext } from "./";

/**
 * S5 context hook — exposes the current form instance to a slot contribution
 * rendered inside a form (any `field.*`/`blocks.*`/`array.*` slot). Backed by
 * `@vexcms/react/form`'s `createFormHook` form context — reads the raw
 * context directly (not the throwing `useFormContext()`) so a slot rendered
 * outside a mounted `<AppForm>` tree gets `undefined` instead of an error.
 *
 * Experimental: breaking changes are still possible before this stabilizes.
 * @returns The current form instance, or `undefined` outside an `<AppForm>`.
 */
export function useVexForm() {
  return useContext(formContext) ?? undefined;
}
