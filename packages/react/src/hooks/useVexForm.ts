"use client";

import { useContext } from "react";
import { AppFormContext } from "../components/form/AppFormContext";

/**
 * S5 context hook — exposes the current TanStack `AppForm` instance to a slot contribution
 * rendered inside a form (any `field.*`/`blocks.*`/`array.*` slot). `undefined` outside an
 * `<AppForm>` — a contribution that needs form access checks for this itself rather than
 * assuming one exists, the same way `FormArray`/`FormBlocks` already throw instead of silently
 * no-op-ing when rendered outside a form context.
 *
 * Experimental: breaking changes are still possible before this stabilizes.
 * @returns The current form instance, or `undefined` outside an `<AppForm>`.
 */
export function useVexForm() {
  return useContext(AppFormContext);
}
