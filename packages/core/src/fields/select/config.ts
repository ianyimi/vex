import type { SelectFieldDef, SelectFieldSingle, SelectFieldMany } from "../../types";

export function select<T extends string = string>(
  options: Omit<SelectFieldMany<T>, "type">,
): SelectFieldDef<T>;
export function select<T extends string = string>(
  options: Omit<SelectFieldSingle<T>, "type">,
): SelectFieldDef<T>;
export function select<T extends string = string>(
  options: Omit<SelectFieldSingle<T>, "type"> | Omit<SelectFieldMany<T>, "type">,
): SelectFieldDef<T> {
  return { type: "select", ...options } as SelectFieldDef<T>;
}
