import { VexAuthConfigError } from "@vexcms/core";
import type { DBFieldAttribute } from "better-auth";

/**
 * Maps a better-auth field type to a Convex validator string.
 *
 * DBFieldType from better-auth is:
 *   "string" | "number" | "boolean" | "date" | "json" | "string[]" | "number[]" | Array<LiteralString>
 *
 * The Array<LiteralString> variant represents enums (e.g., ["admin", "user"]) — stored as a string.
 *
 * @param type - The better-auth field type
 * @param required - Whether the field is required. If false, wraps in v.optional().
 * @returns The Convex validator string (e.g., "v.string()", "v.optional(v.number())")
 * @throws VexAuthConfigError if the type is not recognized
 */
export function betterAuthTypeToValidator({
  type,
  required = false,
  references,
}: {
  type: DBFieldAttribute["type"];
  required?: boolean;
  references?: DBFieldAttribute["references"];
}): string {
  let validator: string;

  if (references) {
    validator = `v.id("${references.model}")`;
  } else if (Array.isArray(type)) {
    validator = "v.string()";
  } else {
    switch (type) {
      case "string":
        validator = "v.string()";
        break;
      case "number":
        validator = "v.number()";
        break;
      case "boolean":
        validator = "v.boolean()";
        break;
      case "date":
        validator = "v.number()";
        break;
      case "json":
        validator = "v.any()";
        break;
      case "string[]":
        validator = "v.array(v.string())";
        break;
      case "number[]":
        validator = "v.array(v.number())";
        break;
      default:
        throw new VexAuthConfigError(`Unknown better-auth field type: ${type}`);
    }
  }

  if (!required) {
    validator = `v.optional(${validator})`;
  }
  return validator;
}
