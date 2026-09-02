import { ADMIN_FIELDS } from "./constants";
import type { AdminField } from "./types";

/**
 * Resolves the TypeScript type string for a field nested inside another field.
 *
 * Blocks, groups and arrays each need this, and each used to inline its own
 * version — all three falling through to `field.interfaceType`. That is why a
 * `select` inside a block generated `string[]` while the same `select` on a
 * collection generated a literal union: only the collection path
 * (`collections/interfaceGen.ts`) knew to read `options`.
 *
 * Collections emit a named companion alias because the union may be reused and
 * a document interface is a named declaration. A block's type is an inline
 * object literal with nowhere to hang an alias, so the union is inlined here.
 *
 * @param field - The nested field definition.
 * @returns The TypeScript type string to emit for this field.
 */
export function childInterfaceType(field: AdminField): string {
  if (field.type === ADMIN_FIELDS.select.type) {
    const options = (field as { options?: { value: string }[] }).options ?? [];
    // A `select` with no options configured has no union to emit; widening to
    // the declared `string[]` is correct rather than producing `()[]`.
    if (options.length === 0) return field.interfaceType;
    return `(${options.map((option) => `"${option.value}"`).join(" | ")})[]`;
  }

  if (field.type === ADMIN_FIELDS.group.type && field.interfaceName) {
    return field.interfaceName;
  }

  if (field.type === ADMIN_FIELDS.blocks.type && field.interfaceName) {
    return `${field.interfaceName}[]`;
  }

  return field.interfaceType;
}
