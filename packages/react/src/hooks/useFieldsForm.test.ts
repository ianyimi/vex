import { act, renderHook } from "@testing-library/react";
import { checkbox, text } from "@vexcms/core";
import { describe, expect, it, vi } from "vitest";
import { useFieldsForm } from "./useFieldsForm";

describe("useFieldsForm", () => {
  it("blocks submission on a required field with no conditions", async () => {
    const onSubmit = vi.fn();
    const { result } = renderHook(() =>
      useFieldsForm({
        fields: { title: text({ required: true }) },
        onSubmit,
      }),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits once the required field is filled, no conditions", async () => {
    const onSubmit = vi.fn();
    const { result } = renderHook(() =>
      useFieldsForm({
        fields: { title: text({ required: true }) },
        document: { title: "Hello" },
        onSubmit,
      }),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("skips validation on a condition-hidden required field (hasFieldConditions)", async () => {
    const onSubmit = vi.fn();
    const fields = {
      enabled: checkbox(),
      secret: text({
        required: true,
        admin: { condition: ({ data }) => typeof data === "object" && data !== null && "enabled" in data && (data as Record<string, unknown>).enabled === true },
      }),
    };
    const { result } = renderHook(() =>
      useFieldsForm({
        fields,
        document: { enabled: false, secret: "" },
        onSubmit,
      }),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("still validates a condition-visible required field (hasFieldConditions)", async () => {
    const onSubmit = vi.fn();
    const fields = {
      enabled: checkbox(),
      secret: text({
        required: true,
        admin: { condition: ({ data }) => typeof data === "object" && data !== null && "enabled" in data && (data as Record<string, unknown>).enabled === true },
      }),
    };
    const { result } = renderHook(() =>
      useFieldsForm({
        fields,
        document: { enabled: true, secret: "" },
        onSubmit,
      }),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("re-evaluates the condition against the latest value, not a stale snapshot", async () => {
    const onSubmit = vi.fn();
    const fields = {
      enabled: checkbox(),
      secret: text({
        required: true,
        admin: { condition: ({ data }) => typeof data === "object" && data !== null && "enabled" in data && (data as Record<string, unknown>).enabled === true },
      }),
    };
    const { result } = renderHook(() =>
      useFieldsForm({
        fields,
        document: { enabled: false, secret: "" },
        onSubmit,
      }),
    );

    act(() => {
      result.current.setFieldValue("enabled", true);
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
