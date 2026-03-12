import type { JsonFieldDef } from "../../types";

export function json(options?: Omit<JsonFieldDef, "type">): JsonFieldDef {
  return {
    type: "json",
    ...options,
  };
}
