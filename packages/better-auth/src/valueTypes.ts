import { VexAuthConfigError } from "@vexcms/core";
import type { DBFieldAttribute } from "better-auth";

/**
 * Maps a better-auth field type to a Convex valueType string.
 *
 * DBFieldType from better-auth is:
 *   "string" | "number" | "boolean" | "date" | "json" | "string[]" | "number[]" | Array<LiteralString>
 *
 * The Array<LiteralString> variant represents enums (e.g., ["admin", "user"]) — stored as a string.
 *
 * @param type - The better-auth field type
 * @param required - Whether the field is required. If false, wraps in v.optional().
 * @returns The Convex valueType string (e.g., "v.string()", "v.optional(v.number())")
 * @throws VexAuthConfigError if the type is not recognized
 */
export function betterAuthTypeToValueType({
  type,
  required = false,
  references,
}: {
  type: DBFieldAttribute["type"];
  required?: boolean;
  references?: DBFieldAttribute["references"];
}): string {
  let valueType: string;

  if (references) {
    valueType = `v.id("${references.model}")`;
  } else if (Array.isArray(type)) {
    valueType = "v.string()";
  } else {
    switch (type) {
      case "string":
        valueType = "v.string()";
        break;
      case "number":
        valueType = "v.number()";
        break;
      case "boolean":
        valueType = "v.boolean()";
        break;
      case "date":
        valueType = "v.number()";
        break;
      case "json":
        valueType = "v.any()";
        break;
      case "string[]":
        valueType = "v.array(v.string())";
        break;
      case "number[]":
        valueType = "v.array(v.number())";
        break;
      default:
        throw new VexAuthConfigError(`Unknown better-auth field type: ${type}`);
    }
  }

  if (!required) {
    valueType = `v.optional(${valueType})`;
  }
  return valueType;
}
