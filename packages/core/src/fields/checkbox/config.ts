import type { CheckboxFieldDef } from "../../types";

export function checkbox(options?: Omit<CheckboxFieldDef, "type">): CheckboxFieldDef {
  return {
    type: "checkbox",
    ...(options?.required && options?.defaultValue === undefined
      ? { defaultValue: false }
      : {}),
    ...options,
  };
}
