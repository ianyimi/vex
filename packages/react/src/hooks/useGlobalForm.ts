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

/**
 * Creates a TanStack Form instance pre-configured for a VexCMS global.
 *
 * Mirror of `useCollectionForm` (spec 35, D21): same shape, but drives
 * defaults and validation from the global mirrors `getGlobalDefaultValues`
 * / `getGlobalInputSchema`. `TGlobalSlug` is inferred from the `global`
 * argument — after `vex generate`, passing a global narrows the hook's
 * internal types to that global's document shape.
 */
export function useGlobalForm<
  TFieldMeta extends {} = {},
  TGlobalMeta extends {} = {},
  TGlobalSlug extends GlobalSlug = GlobalSlug,
>(
  props: {
    global: GlobalConfig<TFieldMeta, TGlobalMeta, TGlobalSlug>;
    document?: VexDocumentGlobal | null;
  } & FormOptions<
    GlobalDocumentBySlug[TGlobalSlug],
    any, any, any, any, any, any, any, any, any, any, any
  >,
): AnyFormApi {
  const { global, document, validators, ...formOptions } = props;
  return useForm({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    defaultValues: getGlobalDefaultValues({ global, document }) as any,
    ...formOptions,
    validators: {
      onSubmitAsync: getGlobalInputSchema({ global }),
      onBlur: getGlobalInputSchema({ global }),
      ...validators,
    },
  }) as AnyFormApi;
}
