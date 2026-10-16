import { describe, expect, it } from "vitest";
import { act, render } from "@testing-library/react";
import { useForm } from "@tanstack/react-form";
import { changedValues } from "../components/form/changedValues";
import { useResetWhenSaved } from "./useResetWhenSaved";
import type { AnyFormApi } from "../components/form/AppFormContext";

type Doc = { body: string; title: string };

/**
 * Mounts a form the way an edit view does — defaults rebuilt from the
 * `document` prop every render — so `form.reset()` reads whichever document
 * is current, which is exactly what makes an early reset revert to stale data.
 */
function renderHarness(initialDocument: Doc) {
  const formRef: { current: AnyFormApi | undefined } = { current: undefined };
  const resetRef: { current: ((changes: Record<string, unknown>) => void) | undefined } = {
    current: undefined,
  };

  function Harness({ document }: { document: Doc }) {
    const form = useForm({ defaultValues: document });
    formRef.current = form as AnyFormApi;
    resetRef.current = useResetWhenSaved({ form: form as AnyFormApi, document });
    return (
      <>
        <form.Field name="body">{() => null}</form.Field>
        <form.Field name="title">{() => null}</form.Field>
      </>
    );
  }

  const view = render(<Harness document={initialDocument} />);
  return {
    form: () => formRef.current!,
    edit: (key: keyof Doc, value: string) =>
      act(() => {
        formRef.current!.setFieldValue(key, value);
      }),
    saved: (changes: Record<string, unknown>) =>
      act(() => {
        resetRef.current!(changes);
      }),
    setDocument: (document: Doc) =>
      act(() => {
        view.rerender(<Harness document={document} />);
      }),
  };
}

describe("useResetWhenSaved", () => {
  it("keeps the saved value on screen while the live document is still pre-save", () => {
    const harness = renderHarness({ body: "old", title: "T" });
    harness.edit("body", "new");

    harness.saved({ body: "new" });

    // An immediate reset here would revert to "old" — the autosave loop's trigger.
    expect(harness.form().state.values.body).toBe("new");
    expect(changedValues(harness.form())).toEqual({ body: "new" });
  });

  it("resets to the saved value once the live document reflects the save", () => {
    const harness = renderHarness({ body: "old", title: "T" });
    harness.edit("body", "new");
    harness.saved({ body: "new" });

    harness.setDocument({ body: "new", title: "T" });

    expect(harness.form().state.values.body).toBe("new");
    expect(changedValues(harness.form())).toEqual({});
  });

  it("settles when the server stored a different value than was sent (beforeChange normalization)", () => {
    const harness = renderHarness({ body: "old", title: "T" });
    harness.edit("body", "New ");
    harness.saved({ body: "New " });

    harness.setDocument({ body: "new", title: "T" });

    expect(harness.form().state.values.body).toBe("new");
    expect(changedValues(harness.form())).toEqual({});
  });

  it("leaves edits typed during the save dirty instead of discarding them", () => {
    const harness = renderHarness({ body: "old", title: "T" });
    harness.edit("body", "new");
    harness.saved({ body: "new" });
    harness.edit("body", "newer"); // keystrokes after the save started

    harness.setDocument({ body: "new", title: "T" });

    expect(harness.form().state.values.body).toBe("newer");
    expect(changedValues(harness.form())).toEqual({ body: "newer" });
  });

  it("resets immediately when the document already reflects the save", () => {
    const harness = renderHarness({ body: "old", title: "T" });
    harness.edit("body", "new");
    harness.setDocument({ body: "new", title: "T" });

    harness.saved({ body: "new" });

    expect(changedValues(harness.form())).toEqual({});
  });
});
