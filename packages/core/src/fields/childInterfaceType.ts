import { ADMIN_FIELDS, FIELD_SCHEMA_VALIDATORS } from "./constants";
import type { AdminDataField } from "./types";

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
 * A nullable field's type string always ends with ` | null`, appended AFTER
 * any type-specific override (the select literal union, a named group/blocks
 * alias) — `field.nullable` wraps the WHOLE stored value, union included.
 *
 * @param field - The nested field definition.
 * @returns The TypeScript type string to emit for this field.
 */
export function childInterfaceType(field: AdminDataField): string {
  const nullableSuffix = field.nullable ? " | null" : "";
  if (field.type === ADMIN_FIELDS.select.type) {
    if (field.schema?.validator === FIELD_SCHEMA_VALIDATORS.string) return `string${nullableSuffix}`;
    const options = (field as { options?: { value: string }[] }).options ?? [];
    if (options.length === 0) return `${field.interfaceType}${nullableSuffix}`;
    const union = `(${options.map((option) => `"${option.value}"`).join(" | ")})`;
    return field.schema?.validator === FIELD_SCHEMA_VALIDATORS.literal
      ? `${union}${nullableSuffix}`
      : `${union}[]${nullableSuffix}`;
  }

  if (field.type === ADMIN_FIELDS.group.type && field.interfaceName) {
    return `${field.interfaceName}${nullableSuffix}`;
  }

  if (field.type === ADMIN_FIELDS.blocks.type && field.interfaceName) {
    return `${field.interfaceName}[]${nullableSuffix}`;
  }

  if (field.type === ADMIN_FIELDS.variant.type && field.interfaceName) {
    return `${field.interfaceName}${nullableSuffix}`;
  }

  return `${field.interfaceType}${nullableSuffix}`;
}
