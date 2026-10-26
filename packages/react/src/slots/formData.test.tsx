import type { ReactNode } from "react";
import { useForm } from "@tanstack/react-form";
import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { resolveSiblingData, useSlotConditionData } from "./formData";
import { AppForm } from "../forms";
import type { AnyFormApi } from "../forms";

describe("resolveSiblingData", () => {
  it("returns the whole data object for a top-level name", () => {
    expect(resolveSiblingData({ data: { title: "x" }, name: "title" })).toEqual(
      { title: "x" },
    );
  });

  it("resolves the parent path for a nested name", () => {
    expect(
      resolveSiblingData({ data: { seo: { title: "x" } }, name: "seo.title" }),
    ).toEqual({ title: "x" });
  });
});

describe("useSlotConditionData", () => {
  function withForm(defaultValues: Record<string, unknown>) {
    let form: AnyFormApi | undefined;
    function Wrapper({ children }: { children: ReactNode }) {
      const f = useForm({ defaultValues });
      form = f as AnyFormApi;
      return <AppForm form={f}>{children}</AppForm>;
    }
    return { Wrapper, getForm: (): AnyFormApi => form! };
  }

  it("returns undefined outside an <AppForm>", () => {
    const { result } = renderHook(() => useSlotConditionData(undefined));
    expect(result.current).toBeUndefined();
  });

  it("returns the whole form's values as both data and siblingData when name is omitted", () => {
    const { Wrapper } = withForm({ title: "x" });
    const { result } = renderHook(() => useSlotConditionData(undefined), {
      wrapper: Wrapper,
    });
    expect(result.current).toEqual({
      data: { title: "x" },
      siblingData: { title: "x" },
    });
  });

  it("resolves siblingData from name's parent path inside an <AppForm>", () => {
    const { Wrapper } = withForm({
      content: [{ heading: "a" }, { heading: "b" }],
    });
    const { result } = renderHook(() => useSlotConditionData("content[1]"), {
      wrapper: Wrapper,
    });
    expect(result.current?.siblingData).toEqual({ heading: "b" });
  });
});
