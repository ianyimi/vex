import { FormOptions, useForm } from "@tanstack/react-form";
import {
  type CollectionSlug,
  type CollectionConfig,
  getCollectionDefaultValues,
  getCollectionInputSchema,
  type TDocument,
  DocumentBySlug,
} from "@vexcms/core";
import type { AnyFormApi } from "../components/form/AppFormContext";

/**
 * Creates a TanStack Form instance pre-configured for a VexCMS collection.
 *
 * Sets `defaultValues` from the collection's field defaults and wires up
 * the collection's Zod input schema as the `onBlur` and `onSubmitAsync`
 * validators. `TCollectionSlug` is inferred from the `collection` argument — after
 * running `vex generate`, passing a collection with slug `"posts"` narrows
 * the hook's internal types to that collection without any explicit annotation.
 *
 * @param props - Hook props.
 * @param props.collection - The collection whose fields drive the form shape.
 *   `TCollectionSlug` is inferred from this argument.
 * @param props.document - Optional existing document to pre-populate
 *   `defaultValues` when editing. Accepts any `TDocument`; type narrowing
 *   to a specific collection's interface is left to the caller.
 * @returns A TanStack Form instance compatible with `<AppForm>`.
 *
 * @example
 * ```ts
 * // Create mode — defaultValues come from field defaults
 * const form = useCollectionForm({ collection: postsCollection })
 *
 * // Edit mode — defaultValues pre-populated from the fetched document
 * const form = useCollectionForm({ collection: postsCollection, document: doc,
 *   onSubmit: async ({ value }) => { await save(value) },
 * })
 * ```
 */
export function useCollectionForm<
  TFieldMeta extends {} = {},
  TCollectionMeta extends {} = {},
  TCollectionSlug extends CollectionSlug = CollectionSlug,
>(
  props: {
    collection: CollectionConfig<TFieldMeta, TCollectionMeta, TCollectionSlug>;
    document?: TDocument;
  } & FormOptions<
    DocumentBySlug[TCollectionSlug],
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any
  >,
): AnyFormApi {
  const { collection, document, validators, ...formOptions } = props;
  return useForm({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    defaultValues: getCollectionDefaultValues({ collection, document }) as any,
    ...formOptions,
    validators: {
      onSubmitAsync: getCollectionInputSchema({ collection }),
      onBlur: getCollectionInputSchema({ collection }),
      ...validators,
    },
  }) as AnyFormApi;
}
