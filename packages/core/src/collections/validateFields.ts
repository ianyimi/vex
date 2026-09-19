import { ConvexError } from "convex/values";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import type { CollectionConfig } from "./types";

/**
 * Runs each changed field's `validate()` hook against the merged document,
 * skipping fields whose key isn't in `keys` (unchanged on `update`, or every
 * field on `create`) or that don't define `validate`. Throws a `ConvexError`
 * on the first field that reports a validation failure.
 *
 * @param props - The collection, resolved document, changed field keys, and mutation ctx.
 * @returns Nothing; resolves once every applicable field's `validate()` has passed.
 */
export async function validateFields<
  TDataModel extends GenericDataModel = GenericDataModel,
>(props: {
  collection: CollectionConfig;
  doc: Record<string, unknown>;
  keys: Iterable<string>;
  ctx: GenericMutationCtx<TDataModel>;
}): Promise<void> {
  const keys = new Set(props.keys);
  for (const [fieldKey, field] of Object.entries(props.collection.fields)) {
    if (!keys.has(fieldKey) || !field.validate) continue;
    const validate = field.validate as unknown as (props: {
      value: unknown;
      doc: Record<string, unknown>;
      fieldKey: string;
      field: unknown;
      ctx: GenericMutationCtx<TDataModel>;
    }) => Promise<string | void> | string | void;
    const error = await validate({
      value: props.doc[fieldKey],
      doc: props.doc,
      fieldKey,
      field,
      ctx: props.ctx,
    });
    if (error) throw new ConvexError({ message: "Validation failed", field: fieldKey, error });
  }
}
