import { RelationshipFieldMeta, RelationshipFieldOptions, GenericVexField } from "../../types";

export function relationship(
  options: RelationshipFieldOptions & { hasMany: true },
): GenericVexField<string[], RelationshipFieldMeta>;

export function relationship(
  options: RelationshipFieldOptions & { hasMany?: false },
): GenericVexField<string, RelationshipFieldMeta>;

export function relationship(
  options: RelationshipFieldOptions,
): GenericVexField<string | string[], RelationshipFieldMeta> {
  return {
    _type: options.hasMany ? [] : "",
    _meta: {
      type: "relationship",
      ...options,
    },
  };
}
