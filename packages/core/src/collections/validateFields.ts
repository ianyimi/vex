import { ConvexError } from "convex/values";
import type { Value } from "convex/values";
import { createVexCallbackApi, type VexCallbackApi } from "../api/server";
import type { VexConfig } from "../config";
import type { VexMutationCtx } from "../types/generated";
import type { CollectionConfig } from "./types";

/**
 * Runs each changed field's `validate()` against the merged document, skipping
 * fields whose key isn't in `keys` (unchanged on `update`, every field on
 * `create`) or that don't define `validate`.
 *
 * A field reports failure by **throwing**, not by returning a message: a
 * thrown error carries a stack, can be a project's own error subclass, and can
 * attach arbitrary structured data through `ConvexError`. A returned string
 * could carry none of that, and made the success path (`return undefined`)
 * easy to hit by accident.
 *
 * Whatever a field throws is re-thrown as a `ConvexError` carrying the field
 * key, so the admin panel can attribute the failure to one input. A
 * `ConvexError`'s own `data` is preserved verbatim — an object payload is
 * merged with `field`, a plain-string payload becomes `message` — so a project
 * can surface codes or hints of its own.
 *
 * @param props - The collection, resolved document, changed field keys, mutation
 *   ctx, and resolved config (needed to build the `vex` api each callback receives).
 * @returns Nothing; resolves once every applicable field's `validate()` has passed.
 * @throws {ConvexError} With `{ field, message, ... }` for the first field that throws.
 */
export async function validateFields(props: {
  collection: CollectionConfig;
  doc: Record<string, unknown>;
  keys: Iterable<string>;
  ctx: VexMutationCtx;
  config: VexConfig;
}): Promise<void> {
  const keys = new Set(props.keys);
  // Built once per write, not per field: it closes over nothing field-specific.
  const vex = createVexCallbackApi({ ctx: props.ctx, config: props.config });
  for (const [fieldKey, field] of Object.entries(props.collection.fields)) {
    if (!keys.has(fieldKey) || !field.validate) continue;
    const validate = field.validate as unknown as (props: {
      value: unknown;
      doc: Record<string, unknown>;
      fieldKey: string;
      field: unknown;
      ctx: VexMutationCtx;
      vex: VexCallbackApi;
    }) => Promise<void> | void;

    try {
      await validate({
        value: props.doc[fieldKey],
        doc: props.doc,
        fieldKey,
        field,
        ctx: props.ctx,
        vex,
      });
    } catch (thrown) {
      throw toFieldValidationError({ thrown, fieldKey });
    }
  }
}

/**
 * Normalises whatever a field's `validate()` threw into one `ConvexError`
 * shape, so every consumer reads the failure the same way regardless of what
 * the project chose to throw.
 *
 * @param props.thrown - The value the field threw.
 * @param props.fieldKey - The field that rejected the write.
 * @returns A `ConvexError` whose data always carries `field` and `message`.
 */
function toFieldValidationError(props: {
  thrown: unknown;
  fieldKey: string;
}): ConvexError<Value> {
  const { thrown, fieldKey } = props;

  if (thrown instanceof ConvexError) {
    const data = thrown.data as unknown;
    return new ConvexError(
      typeof data === "object" && data !== null
        ? ({ message: "Validation failed", ...data, field: fieldKey } as Value)
        : { message: String(data), field: fieldKey },
    );
  }

  return new ConvexError({
    message: thrown instanceof Error ? thrown.message : String(thrown),
    field: fieldKey,
  });
}
