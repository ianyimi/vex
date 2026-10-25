import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useForm } from "@tanstack/react-form";
import { useVexForm } from "./useVexForm";
import { AppForm } from "../components/form/AppForm";
import type { AnyFormApi } from "../components/form/AppFormContext";

describe("useVexForm", () => {
  it("returns null outside an <AppForm>", () => {
    const { result } = renderHook(() => useVexForm());
    expect(result.current).toBeNull();
  });

  it("returns the real form instance inside an <AppForm>", () => {
    let form: AnyFormApi | undefined;
    function Wrapper({ children }: { children: ReactNode }) {
      const f = useForm({ defaultValues: { title: "x" } });
      form = f as AnyFormApi;
      return <AppForm form={f}>{children}</AppForm>;
    }
    const { result } = renderHook(() => useVexForm(), { wrapper: Wrapper });
    expect(result.current).toBe(form);
  });
});
