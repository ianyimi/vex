import { z, type ZodTypeAny } from "zod";
import type { VexField } from "../types";

/**
 * Generate a Zod schema from a collection's field definitions.
 * Used by both the client-side form (for validation on submit)
 * and the server-side mutation (for payload validation).
 *
 * @param props.fields - Record of field name → VexField from the collection
 * @returns A z.object() schema matching the collection's editable fields
 */
export function generateFormSchema(props: {
  fields: Record<string, VexField>;
}): z.ZodObject<Record<string, ZodTypeAny>> {
  const shape: Record<string, ZodTypeAny> = {};

  for (const [fieldName, field] of Object.entries(props.fields)) {
    if (field.admin?.hidden) continue;
    if (field.type === "ui") continue;

    let validator = fieldMetaToZod({ field });

    if (!field.required) {
      validator = validator.optional();
    }

    shape[fieldName] = validator;
  }

  return z.object(shape);
}

/**
 * Convert a single field to its Zod validator.
 * Does NOT handle optional wrapping — that's done by the caller.
 *
 * @param props.field - The field definition (discriminated on `type`)
 * @returns The base Zod type for this field (always required)
 */
export function fieldMetaToZod(props: { field: VexField }): ZodTypeAny {
  switch (props.field.type) {
    case "text": {
      let schema = z.string();
      if (props.field.minLength != null) schema = schema.min(props.field.minLength);
      if (props.field.maxLength != null) schema = schema.max(props.field.maxLength);
      return schema;
    }

    case "number": {
      let schema = z.number();
      if (props.field.min != null) schema = schema.min(props.field.min);
      if (props.field.max != null) schema = schema.max(props.field.max);
      return schema;
    }

    case "checkbox":
      return z.boolean();

    case "select": {
      const values = props.field.options.map((o) => o.value);
      if (values.length === 0) return z.string();
      const enumSchema = z.enum(values as [string, ...string[]]);
      if (props.field.hasMany) {
        return z.array(enumSchema);
      }
      return enumSchema;
    }

    case "date":
      return z.number();

    case "imageUrl":
      return z.string().url().or(z.literal(""));

    case "relationship": {
      if (props.field.hasMany) {
        return z.array(z.string());
      }
      return z.string();
    }

    case "upload": {
      if (props.field.hasMany) {
        return z.array(z.string());
      }
      return z.string();
    }

    case "json":
      return z.any();

    case "richtext":
      return z.any();

    case "array": {
      let schema = z.array(fieldMetaToZod({ field: props.field.field }));
      if (props.field.min != null) schema = schema.min(props.field.min);
      if (props.field.max != null) schema = schema.max(props.field.max);
      return schema;
    }

    case "blocks": {
      const blockSchemas = props.field.blocks.map((blockDef) => {
        const shape: Record<string, ZodTypeAny> = {
          blockType: z.literal(blockDef.slug),
          blockName: z.string().optional(),
          _key: z.string(),
        };
        for (const [fieldName, field] of Object.entries(blockDef.fields)) {
          let validator = fieldMetaToZod({ field: field as VexField });
          if (!(field as VexField).required) {
            validator = validator.optional();
          }
          shape[fieldName] = validator;
        }
        return z.object(shape);
      });

      if (blockSchemas.length === 0) {
        let schema = z.array(z.any());
        if (props.field.min != null) schema = schema.min(props.field.min);
        if (props.field.max != null) schema = schema.max(props.field.max);
        return schema;
      }

      const union =
        blockSchemas.length === 1
          ? blockSchemas[0]
          : z.discriminatedUnion(
              "blockType",
              blockSchemas as [z.ZodObject<any>, z.ZodObject<any>, ...z.ZodObject<any>[]],
            );

      let schema = z.array(union);
      if (props.field.min != null) schema = schema.min(props.field.min);
      if (props.field.max != null) schema = schema.max(props.field.max);
      return schema;
    }

    default:
      return z.any();
  }
}
