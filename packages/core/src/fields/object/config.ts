import type { ObjectFieldDef } from "../../types";

export function object(options: Omit<ObjectFieldDef, "type">): ObjectFieldDef {
  return { type: "object", ...options };
}
