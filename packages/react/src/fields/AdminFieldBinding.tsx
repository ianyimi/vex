"use client";

import type { ReactNode } from "react";
import type { AnyFieldApi } from "@tanstack/react-form";
import { fieldContext, formContext, useFormContext } from "../forms";

/**
 * The subset of the real `ReactFormExtendedApi` this binding needs —
 * `useFormContext()` (from `createFormHookContexts()`) is typed as the bare
 * form-core `AnyFormApi`, which has no `Field` render-prop component; the
 * runtime value IS a full `ReactFormExtendedApi` (built by `useAppForm`), so
 * this is a safe narrowing of an already-known richer shape, not raw input.
 */
interface FieldCapableFormApi {
  Field: (props: { name: string; children: (field: AnyFieldApi) => ReactNode }) => ReactNode;
}

/**
 * Binds an admin `*FieldAdmin` component's `name` to the nearest `<AppForm>`'s
 * form instance, providing the `fieldContext` every `@vexcms/react/form` leaf
 * field component (`TextField`, `EmailField`, …) reads via `useFieldContext()`.
 *
 * Two usage paths, mirroring the pre-step-12 `createFieldInput`'s own
 * `field`-prop escape hatch:
 * - **`field` prop omitted (the normal admin case):** reads the form via
 *   `useFormContext()` and opens `form.Field name={name}` itself, providing
 *   the resulting `FieldApi` through `fieldContext`.
 * - **`field` prop provided (test/validation harnesses):** provides that
 *   `FieldApi` directly, skipping `form.Field` entirely — used when a caller
 *   needs an explicit field instance with its own validators attached outside
 *   the normal admin wiring.
 *
 * @param props.name - The field's form path, forwarded to `form.Field`.
 * @param props.field - An explicit `FieldApi` to provide directly, bypassing `form.Field`.
 * @param props.children - The `@vexcms/react/form` leaf field component to render bound.
 * @returns The bound field context provider wrapping `props.children`.
 * @throws {Error} When `field` is omitted and there is no enclosing `<AppForm>`.
 */
export function AdminFieldBinding(props: {
  name: string;
  field?: AnyFieldApi;
  children: ReactNode;
}): ReactNode {
  const form = useFormContext();
  if (!form) {
    throw new Error(
      `Field "${props.name}" must be rendered inside <AppForm> or receive an explicit field prop.`,
    );
  }
  if (props.field) {
    return (
      <formContext.Provider value={form}>
        <fieldContext.Provider value={props.field}>{props.children}</fieldContext.Provider>
      </formContext.Provider>
    );
  }
  const fieldCapableForm = form as unknown as FieldCapableFormApi;
  return (
    <formContext.Provider value={form}>
      <fieldCapableForm.Field name={props.name}>
        {(field) => <fieldContext.Provider value={field}>{props.children}</fieldContext.Provider>}
      </fieldCapableForm.Field>
    </formContext.Provider>
  );
}
