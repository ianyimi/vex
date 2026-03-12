import type { NumberFieldDef } from "../../types";

export function number(options?: Omit<NumberFieldDef, "type">): NumberFieldDef {
  return {
    type: "number",
    ...(options?.required && options?.defaultValue === undefined
      ? { defaultValue: 0 }
      : {}),
    ...options,
  };
}
