import type { RelationshipFieldDef, RelationshipFieldSingle, RelationshipFieldMany } from "../../types";

export function relationship(
  options: Omit<RelationshipFieldMany, "type">,
): RelationshipFieldDef;
export function relationship(
  options: Omit<RelationshipFieldSingle, "type">,
): RelationshipFieldDef;
export function relationship(
  options: Omit<RelationshipFieldSingle, "type"> | Omit<RelationshipFieldMany, "type">,
): RelationshipFieldDef {
  return { type: "relationship", ...options } as RelationshipFieldDef;
}
