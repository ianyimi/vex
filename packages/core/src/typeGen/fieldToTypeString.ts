import type { VexField } from "../types";
import { slugToInterfaceName } from "./slugToInterfaceName";

/**
 * Convert a VexField to its TypeScript type string for generated interfaces.
 *
 * @param props.field - The field definition
 * @param props.blockInterfaceNames - Map of block slug → interface name (for blocks fields)
 * @returns TypeScript type string (e.g., "string", "number", "'draft' | 'published'", "HeroBlock[]")
 */
export function fieldToTypeString(props: {
  field: VexField;
  blockInterfaceNames?: Map<string, string>;
}): string {
  switch (props.field.type) {
    case "text":
      return "string";
    case "number":
      return "number";
    case "checkbox":
      return "boolean";
    case "date":
      return "number";
    case "imageUrl":
      return "string";
    case "json":
      return "Record<string, unknown>";
    case "richtext":
      return "any";
    case "ui":
      return "never";

    case "select": {
      const values = props.field.options.map((o) => o.value);
      if (values.length === 0) return "string";
      const union = values.map((v) => `'${v}'`).join(" | ");
      if (props.field.hasMany) {
        return `(${union})[]`;
      }
      return union;
    }

    case "relationship": {
      const idType = `Id<'${props.field.to}'>`;
      return props.field.hasMany ? `${idType}[]` : idType;
    }

    case "upload": {
      const idType = `Id<'${props.field.to}'>`;
      return props.field.hasMany ? `${idType}[]` : idType;
    }

    case "array": {
      const inner = fieldToTypeString({
        field: props.field.field,
        blockInterfaceNames: props.blockInterfaceNames,
      });
      const needsParens = inner.includes("|");
      return needsParens ? `(${inner})[]` : `${inner}[]`;
    }

    case "blocks": {
      const names = props.field.blocks.map((b) => {
        if (props.blockInterfaceNames?.has(b.slug)) {
          return props.blockInterfaceNames.get(b.slug)!;
        }
        return b.interfaceName ?? slugToInterfaceName({ slug: b.slug });
      });
      if (names.length === 0) return "unknown[]";
      if (names.length === 1) return `${names[0]}[]`;
      return `(${names.join(" | ")})[]`;
    }

    default:
      return "unknown";
  }
}
