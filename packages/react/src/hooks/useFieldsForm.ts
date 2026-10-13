import {
  type FormAsyncValidateOrFn,
  type FormOptions,
  type FormValidateOrFn,
  useForm,
} from "@tanstack/react-form";
import {
  type AdminField,
  getFieldsDefaultValues,
  getFieldsInputSchema,
  type TDocument,
} from "@vexcms/core";
import type { AnyFormApi } from "../components/form/AppFormContext";
import { pickReadableSchema, pickReadableValues } from "../components/form/readableFields";

type SyncValidator<TData> = undefined | FormValidateOrFn<TData>;
type AsyncValidator<TData> = undefined | FormAsyncValidateOrFn<TData>;

/** `useForm` options a caller may pass through, typed against `TData`. */
type FieldsFormOptions<TData> = FormOptions<
  TData,
  SyncValidator<TData>,
  SyncValidator<TData>,
  AsyncValidator<TData>,
  SyncValidator<TData>,
  AsyncValidator<TData>,
  SyncValidator<TData>,
  AsyncValidator<TData>,
  SyncValidator<TData>,
  AsyncValidator<TData>,
  AsyncValidator<TData>,
  unknown
>;

/**
 * Creates a TanStack Form instance driven by a field map.
 *
 * Sets `defaultValues` from the fields' defaults (overlaid with `document` when
 * editing) and wires the fields' Zod input schema as the `onBlur` and
 * `onSubmitAsync` validators. Resource-agnostic: a collection, a global, or any
 * other owner of a field map passes its `fields` (ADR-014).
 *
 * @param props - Hook props.
 * @param props.fields - The field map that drives the form shape.
 * @param props.document - Optional existing document to pre-populate
 *   `defaultValues` when editing.
 * @param props.readableFieldKeys - Field keys the caller may READ when
 *   field-level permissions narrow them. Omit when unrestricted.
 * @returns A TanStack Form instance compatible with `<AppForm>`.
 *
 * @example
 * ```ts
 * // Create mode — defaultValues come from field defaults
 * const form = useFieldsForm({ fields: postsCollection.fields });
 *
 * // Edit mode, with the submitted value typed to the document shape
 * const form = useFieldsForm<Post>({
 *   fields: postsCollection.fields,
 *   document: doc,
 *   onSubmit: async ({ value }) => { await save(value) },
 * });
 * ```
 */
export function useFieldsForm<TData = TDocument>(
  props: {
    fields: Record<string, AdminField>;
    document?: TDocument | Record<string, unknown> | null;
    /**
     * Field keys the caller may READ, when field-level permissions narrow them.
     *
     * A read-denied field is kept out of the form entirely — out of
     * `defaultValues` and out of the validation schema — so it cannot be seen,
     * cannot be submitted, and cannot block submission when it is required.
     * Omit when unrestricted.
     */
    readableFieldKeys?: readonly string[];
  } & FieldsFormOptions<TData>,
): AnyFormApi {
  const { fields, document, validators, readableFieldKeys, ...formOptions } = props;
  // The schema and defaults are both built from the field map at runtime;
  // `TData` is the caller's static description of that same shape, which the
  // compiler cannot connect to the field map's `Record<string, unknown>`.
  const schema = pickReadableSchema(
    getFieldsInputSchema({ fields }),
    readableFieldKeys,
  ) as unknown as FormValidateOrFn<TData> & FormAsyncValidateOrFn<TData>;
  const defaultValues = pickReadableValues(
    getFieldsDefaultValues({ fields, document }),
    readableFieldKeys,
  ) as unknown as TData;
  return useForm({
    defaultValues,
    ...formOptions,
    validators: {
      onSubmitAsync: schema,
      onBlur: schema,
      ...validators,
    },
  }) as AnyFormApi;
}
