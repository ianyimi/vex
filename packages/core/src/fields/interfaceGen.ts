import { CollectionConfig } from "../types";
import { ADMIN_FIELDS } from "./constants";

/**
 * Recursively collects `export type` declarations for every group field that
 * carries an `interfaceName`, at any depth in the field tree.
 *
 * Traversal is depth-first so nested named types are always declared before
 * the parent types that reference them. Both direct group sub-fields and
 * group items inside array fields are visited.
 *
 * @param fields - The field map to walk (collection-level or group sub-fields).
 * @returns Ordered list of `export type Name = ...` strings, ready to prepend
 *   to the generated interface block.
 */
export function getFieldInterfaces(fields: CollectionConfig["fields"]): string[] {
  const declarations: string[] = [];

  for (const field of Object.values(fields)) {
    if (field.type === ADMIN_FIELDS.group.type) {
      // Depth-first: collect nested declarations before this one so that
      // sub-group named types are declared before any type that references them.
      declarations.push(...getFieldInterfaces(field.fields));

      if (field.interfaceName) {
        declarations.push(`export type ${field.interfaceName} = ${field.interfaceType}`);
      }
    } else if (field.type === ADMIN_FIELDS.array.type) {
      // Array items may themselves be groups — visit their fields too.
      if (field.items.type === ADMIN_FIELDS.group.type) {
        declarations.push(...getFieldInterfaces(field.items.fields));

        if (field.items.interfaceName) {
          declarations.push(
            `export type ${field.items.interfaceName} = ${field.items.interfaceType}`,
          );
        }
      }
    } else if (field.type === ADMIN_FIELDS.blocks.type) {
      // Depth-first: recurse into each block's fields for any named sub-groups,
      // then emit each block's own type declaration.
      for (const block of field.blocks) {
        declarations.push(...getFieldInterfaces(block.fields));
        declarations.push(`export type ${block.interfaceName} = ${block.interfaceType}`);
      }
      // Named union alias — emitted after all individual block types.
      if (field.interfaceName) {
        const union = field.blocks.map((b) => b.interfaceName).join(" | ");
        declarations.push(`export type ${field.interfaceName} = ${union}`);
      }
    }
  }

  return declarations;
}
