"use client";

import { createFormHookContexts } from "@tanstack/react-form";

/**
 * The app form's field/form context pair — every form field component reads
 * `useFieldContext()`, every form-level component reads `useFormContext()`.
 * Passed into `createFormHook` in `useAppForm.ts`.
 *
 * @see {@link https://tanstack.com/form/latest/docs/framework/react/guides/form-composition}
 */
export const { fieldContext, useFieldContext, formContext, useFormContext } =
  createFormHookContexts();
