import { z, type ZodTypeAny } from "zod";
import type { VexField, FieldMeta } from "../types";

/**
 * Generate a Zod schema from a collection's field definitions.
 * Used by both the client-side form (for validation on submit)
 * and the server-side mutation (for payload validation).
 *
 * @param props.fields - Record of field name → VexField from the collection config
 * @returns A z.object() schema matching the collection's editable fields
 */
export function generateFormSchema(props: {
  fields: Record<string, VexField>;
}): z.ZodObject<Record<string, ZodTypeAny>> {
  const shape: Record<string, ZodTypeAny> = {};

  for (const [fieldName, field] of Object.entries(props.fields)) {
    if (field._meta.admin?.hidden) continue;

    let validator = fieldMetaToZod({ meta: field._meta as FieldMeta });

    if (!field._meta.required) {
      validator = validator.optional();
    }

    shape[fieldName] = validator;
  }

  return z.object(shape);
}

/**
 * Convert a single field's metadata to its Zod validator.
 * Does NOT handle optional wrapping — that's done by the caller.
 *
 * @param props.meta - The field metadata (discriminated on `type`)
 * @returns The base Zod type for this field (always required)
 */
export function fieldMetaToZod(props: { meta: FieldMeta }): ZodTypeAny {
  switch (props.meta.type) {
    case "text": {
      let schema = z.string();
      if (props.meta.minLength != null) schema = schema.min(props.meta.minLength);
      if (props.meta.maxLength != null) schema = schema.max(props.meta.maxLength);
      return schema;
    }

    case "number": {
      let schema = z.number();
      if (props.meta.min != null) schema = schema.min(props.meta.min);
      if (props.meta.max != null) schema = schema.max(props.meta.max);
      return schema;
    }

    case "checkbox":
      return z.boolean();

    case "select": {
      const values = props.meta.options.map((o) => o.value);
      if (values.length === 0) return z.string();
      const enumSchema = z.enum(values as [string, ...string[]]);
      if (props.meta.hasMany) {
        return z.array(enumSchema);
      }
      return enumSchema;
    }

    case "date":
      return z.number();

    case "imageUrl":
      return z.string().url().or(z.literal(""));

    case "relationship": {
      if (props.meta.hasMany) {
        return z.array(z.string());
      }
      return z.string();
    }

    case "upload": {
      if (props.meta.hasMany) {
        return z.array(z.string());
      }
      return z.string();
    }

    case "json":
      return z.any();

    case "array": {
      let schema = z.array(fieldMetaToZod({ meta: props.meta.field._meta as FieldMeta }));
      if (props.meta.min != null) schema = schema.min(props.meta.min);
      if (props.meta.max != null) schema = schema.max(props.meta.max);
      return schema;
    }

    default:
      return z.any();
  }
}
