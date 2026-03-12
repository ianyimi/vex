import type { TextFieldDef } from "../../types";

export function text(options?: Omit<TextFieldDef, "type">): TextFieldDef {
  return {
    type: "text",
    ...(options?.required && options?.defaultValue === undefined
      ? { defaultValue: "" }
      : {}),
    ...options,
  };
}
