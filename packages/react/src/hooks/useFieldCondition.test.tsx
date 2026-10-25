import { act, renderHook } from "@testing-library/react";
import { useForm } from "@tanstack/react-form";
import { row, tabs, text, type AdminField } from "@vexcms/core";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { isFieldVisible, useFieldCondition } from "./useFieldCondition";
import { AppForm } from "../components/form/AppForm";
import type { AnyFormApi } from "../components/form/AppFormContext";

function renderCondition(props: {
  field: AdminField;
  name: string;
  defaultValues: Record<string, unknown>;
}) {
  let form: AnyFormApi | undefined;

  function Wrapper(wrapperProps: { children: ReactNode }) {
    const f = useForm({ defaultValues: props.defaultValues });
    form = f as AnyFormApi;
    return <AppForm form={f}>{wrapperProps.children}</AppForm>;
  }

  const { result } = renderHook(
    () => useFieldCondition({ field: props.field, name: props.name }),
    { wrapper: Wrapper },
  );

  return { result, getForm: (): AnyFormApi => form! };
}

describe("useFieldCondition", () => {
  it("returns true for a field with no condition", () => {
    const { result } = renderCondition({
      field: text(),
      name: "title",
      defaultValues: { title: "" },
    });
    expect(result.current).toBe(true);
  });

  it("returns true when the condition evaluates truthy", () => {
    const field = text({
      admin: { condition: ({ data }) => typeof data === "object" && data !== null && "enabled" in data && (data as Record<string, unknown>).enabled === true },
    });
    const { result } = renderCondition({
      field,
      name: "secret",
      defaultValues: { enabled: true, secret: "" },
    });
    expect(result.current).toBe(true);
  });

  it("returns false when the condition evaluates falsy", () => {
    const field = text({
      admin: { condition: ({ data }) => typeof data === "object" && data !== null && "enabled" in data && (data as Record<string, unknown>).enabled === true },
    });
    const { result } = renderCondition({
      field,
      name: "secret",
      defaultValues: { enabled: false, secret: "" },
    });
    expect(result.current).toBe(false);
  });

  it("re-evaluates when the form store updates", () => {
    const field = text({
      admin: { condition: ({ data }) => typeof data === "object" && data !== null && "enabled" in data && (data as Record<string, unknown>).enabled === true },
    });
    const { result, getForm } = renderCondition({
      field,
      name: "secret",
      defaultValues: { enabled: false, secret: "" },
    });
    expect(result.current).toBe(false);

    act(() => {
      getForm().setFieldValue("enabled", true);
    });

    expect(result.current).toBe(true);
  });

  it("resolves siblingData from the parent path for a nested name (`seo.title`)", () => {
    const field = text({
      admin: { condition: ({ siblingData }) => siblingData.showTitle === true },
    });
    const { result } = renderCondition({
      field,
      name: "seo.title",
      defaultValues: { seo: { showTitle: true, title: "" } },
    });
    expect(result.current).toBe(true);
  });

  it("uses the whole form values as siblingData for a top-level name", () => {
    const field = text({
      admin: { condition: ({ siblingData }) => siblingData.enabled === true },
    });
    const { result } = renderCondition({
      field,
      name: "enabled",
      defaultValues: { enabled: true },
    });
    expect(result.current).toBe(true);
  });

  it("resolves an array-item parent path (`layout[2].title`)", () => {
    const field = text({
      admin: { condition: ({ siblingData }) => siblingData.kind === "hero" },
    });
    const { result } = renderCondition({
      field,
      name: "layout[2].title",
      defaultValues: {
        layout: [
          { kind: "text" },
          { kind: "text" },
          { kind: "hero", title: "" },
        ],
      },
    });
    expect(result.current).toBe(true);
  });

  it("counts a throwing condition as met", () => {
    const field = text({
      admin: {
        condition: () => {
          throw new Error("boom");
        },
      },
    });
    const { result } = renderCondition({
      field,
      name: "secret",
      defaultValues: { secret: "" },
    });
    expect(result.current).toBe(true);
  });
});

describe("isFieldVisible", () => {
  const data = { enabled: false };

  it("is visible for a field with no condition", () => {
    expect(
      isFieldVisible({ fields: { title: text() }, namePrefix: undefined, data }),
    ).toBe(true);
  });

  it("is hidden when the only field's condition is unmet", () => {
    const field = text({ admin: { condition: ({ data: d }) => typeof d === "object" && d !== null && "enabled" in d && (d as Record<string, unknown>).enabled === true } });
    expect(
      isFieldVisible({ fields: { secret: field }, namePrefix: undefined, data }),
    ).toBe(false);
  });

  it("is hidden for a row whose only child is condition-hidden", () => {
    const field = text({ admin: { condition: ({ data: d }) => typeof d === "object" && d !== null && "enabled" in d && (d as Record<string, unknown>).enabled === true } });
    const fields = { name: row({ fields: { secret: field } }) };
    expect(isFieldVisible({ fields, namePrefix: undefined, data })).toBe(false);
  });

  it("is visible for a row with at least one visible child", () => {
    const hiddenField = text({ admin: { condition: ({ data: d }) => typeof d === "object" && d !== null && "enabled" in d && (d as Record<string, unknown>).enabled === true } });
    const fields = { name: row({ fields: { secret: hiddenField, title: text() } }) };
    expect(isFieldVisible({ fields, namePrefix: undefined, data })).toBe(true);
  });

  it("is visible for tabs when a non-active tab still has a visible child", () => {
    const hiddenField = text({ admin: { condition: ({ data: d }) => typeof d === "object" && d !== null && "enabled" in d && (d as Record<string, unknown>).enabled === true } });
    const fields = {
      info: tabs({
        tabs: [
          { label: "General", fields: { secret: hiddenField } },
          { label: "Advanced", fields: { title: text() } },
        ],
      }),
    };
    expect(isFieldVisible({ fields, namePrefix: undefined, data })).toBe(true);
  });

  it("is hidden for tabs when every tab's every field is condition-hidden", () => {
    const hiddenField = text({ admin: { condition: ({ data: d }) => typeof d === "object" && d !== null && "enabled" in d && (d as Record<string, unknown>).enabled === true } });
    const fields = {
      info: tabs({ tabs: [{ label: "General", fields: { secret: hiddenField } }] }),
    };
    expect(isFieldVisible({ fields, namePrefix: undefined, data })).toBe(false);
  });
});
