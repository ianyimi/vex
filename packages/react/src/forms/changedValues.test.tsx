import { describe, expect, it } from "vitest";
import { act, render } from "@testing-library/react";
import { useForm } from "@tanstack/react-form";
import { changedValues } from "./changedValues";
import type { AnyFormApi } from "@tanstack/react-form";

describe("changedValues", () => {
  it("includes an array field when only a field inside one of its items was edited", () => {
    const formRef: { current: AnyFormApi | undefined } = { current: undefined };
    function Harness() {
      const form = useForm({
        defaultValues: { title: "Page", sections: [{ id: "a", summary: "old" }] },
      });
      formRef.current = form as AnyFormApi;
      return (
        <>
          <form.Field name="title">{() => null}</form.Field>
          <form.Field name="sections[0].summary">{() => null}</form.Field>
        </>
      );
    }
    render(<Harness />);

    act(() => {
      formRef.current!.setFieldValue("sections[0].summary", "new");
    });

    expect(changedValues(formRef.current!)).toEqual({
      sections: [{ id: "a", summary: "new" }],
    });
  });
});
