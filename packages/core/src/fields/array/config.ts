import type { ArrayFieldDef } from "../../types";

export function array(options: Omit<ArrayFieldDef, "type">): ArrayFieldDef {
  return { type: "array", ...options };
}
