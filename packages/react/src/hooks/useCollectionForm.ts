import { FormOptions, useForm } from "@tanstack/react-form";
import {
  type CollectionConfig,
  getCollectionDefaultValues,
  getCollectionInputSchema,
  type TDocument,
} from "@vexcms/core";
import type { AnyFormApi } from "../components/form/AppFormContext";

/**
 * Creates a TanStack Form instance pre-configured for a VexCMS collection.
 *
 * Sets `defaultValues` from the collection's field defaults and wires up
 * the collection's Zod input schema as the `onChange` validator.
 * Returns `AnyFormApi` so the instance can be passed directly to `<AppForm>`.
 *
 * @param props - Hook props.
 * @param props.collection - The collection whose fields drive the form shape.
 * @param props.document - Optional existing document to pre-populate `defaultValues` when editing.
 * @returns A TanStack Form instance compatible with `<AppForm>`.
 */
export function useCollectionForm(
  props: {
    collection: CollectionConfig;
    document?: TDocument;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } & FormOptions<any>,
): AnyFormApi {
  const { collection, document, validators, ...formOptions } = props;
  return useForm({
    defaultValues: getCollectionDefaultValues({ collection, document }),
    ...formOptions,
    validators: {
      onSubmitAsync: getCollectionInputSchema({ collection }),
      onBlur: getCollectionInputSchema({ collection }),
      ...validators,
    },
  });
}
