import { FormOptions, useForm } from "@tanstack/react-form";
import {
  type GlobalSlug,
  type GlobalConfig,
  type GlobalDocumentBySlug,
  type VexDocumentGlobal,
  getGlobalDefaultValues,
  getGlobalInputSchema,
} from "@vexcms/core";
import type { AnyFormApi } from "../components/form/AppFormContext";
import { pickReadableSchema, pickReadableValues } from "../components/form/readableFields";

/**
 * Creates a TanStack Form instance pre-configured for a VexCMS global.
 *
 * Mirror of `useCollectionForm` (spec 35, D21): same shape, but drives
 * defaults and validation from the global mirrors `getGlobalDefaultValues`
 * / `getGlobalInputSchema`. `TGlobalSlug` is inferred from the `global`
 * argument — after `vex generate`, passing a global narrows the hook's
 * internal types to that global's document shape.
 *
 * @param props - The target global config, its currently loaded document
 *   (if any), and any `useForm` options to merge in (e.g. `onSubmit`).
 * @returns The TanStack `AnyFormApi` form instance, pre-wired with the
 *   global's default values and submit/blur validators.
 */
export function useGlobalForm<
  TFieldMeta extends {} = {},
  TGlobalMeta extends {} = {},
  TGlobalSlug extends GlobalSlug = GlobalSlug,
>(
  props: {
    global: GlobalConfig<TFieldMeta, TGlobalMeta, TGlobalSlug>;
    document?: VexDocumentGlobal | null;
    /**
     * Field keys the caller may READ, when field-level permissions narrow them.
     *
     * A read-denied field is kept out of the form entirely — out of
     * `defaultValues` and out of the validation schema — so it cannot be seen,
     * cannot be submitted, and cannot block submission when it is required.
     * Omit when unrestricted.
     */
    readableFieldKeys?: readonly string[];
  } & FormOptions<
    GlobalDocumentBySlug[TGlobalSlug],
    any, any, any, any, any, any, any, any, any, any, any
  >,
): AnyFormApi {
  const { global, document, validators, readableFieldKeys, ...formOptions } = props;
  const schema = pickReadableSchema(getGlobalInputSchema({ global }), readableFieldKeys);
  return useForm({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    defaultValues: pickReadableValues(
      getGlobalDefaultValues({ global, document }),
      readableFieldKeys,
    ) as any,
    ...formOptions,
    validators: {
      onSubmitAsync: schema,
      onBlur: schema,
      ...validators,
    },
  }) as AnyFormApi;
}
