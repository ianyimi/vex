"use client";

import { createFormHookContexts } from "@tanstack/react-form";

import { globalSingleton } from "../utils/globalSingleton";

/**
 * The app form's field/form context pair — every form field component reads
 * `useFieldContext()`, every form-level component reads `useFormContext()`.
 * Passed into `createFormHook` in `useAppForm.ts`.
 *
 * Wrapped in `globalSingleton` for the same reason every other context in
 * this package is (see `utils/globalSingleton.ts`) — `createFormHookContexts()`
 * itself calls React's `createContext()` internally, so the returned tuple is
 * just as vulnerable to Turbopack compiling this module's factory more than
 * once as a raw `createContext()` call would be.
 *
 * @see {@link https://tanstack.com/form/latest/docs/framework/react/guides/form-composition}
 */
export const { fieldContext, useFieldContext, formContext, useFormContext } = globalSingleton(
  "forms/formContext",
  () => createFormHookContexts(),
);
