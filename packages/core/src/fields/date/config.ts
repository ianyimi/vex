import type { DateFieldDef } from "../../types";

export function date(options?: Omit<DateFieldDef, "type">): DateFieldDef {
  return {
    type: "date",
    ...(options?.required && options?.defaultValue === undefined
      ? { defaultValue: 0 }
      : {}),
    ...options,
  };
}
