import { describe, expect, it } from "vitest";
import { act, render } from "@testing-library/react";
import { useForm } from "@tanstack/react-form";
import { changedValues, isFieldKeyDirty } from "../components/form/changedValues";
import { useLiveFieldMerge } from "./useLiveFieldMerge";
import type { AnyFormApi } from "../components/form/AppFormContext";

type Doc = { name: string; price: number; tags: string[]; light: { background: string } };

const FIELD_KEYS = ["name", "price", "tags", "light"] as const;

function baseDocument(): Doc {
  return { name: "Widget", price: 10, tags: ["red", "blue"], light: { background: "white" } };
}

/**
 * Mounts a form the way an edit view does — one `form.Field` per top-level key
 * plus the nested `light.background` leaf a `group` registers — so TanStack
 * seeds real `fieldMetaBase` entries, the shape `isFieldKeyDirty`/
 * `changedValues` read. An untouched, unmounted field has no meta entry at
 * all, so a harness that skips this would test nothing. `formRef` mirrors
 * `nestedFieldContainer.ts`'s existing convention.
 */
function renderMergeHarness(initialDocument: Doc) {
  const formRef: { current: AnyFormApi | undefined } = { current: undefined };

  function Harness({ document }: { document: Doc }) {
    const form = useForm({ defaultValues: document });
    formRef.current = form as AnyFormApi;
    useLiveFieldMerge({ form: form as AnyFormApi, document, fieldKeys: FIELD_KEYS });
    return (
      <>
        <form.Field name="name">{() => null}</form.Field>
        <form.Field name="price">{() => null}</form.Field>
        <form.Field name="tags">{() => null}</form.Field>
        <form.Field name="light.background">{() => null}</form.Field>
      </>
    );
  }

  const view = render(<Harness document={initialDocument} />);
  return {
    formRef,
    setDocument: (document: Doc) => {
      act(() => {
        view.rerender(<Harness document={document} />);
      });
    },
  };
}

/**
 * Forces the form-wide freeze a real edit anywhere produces (`state.isTouched`
 * aggregates across every registered field) without changing a value, so each
 * test proves the per-field merge did the work rather than TanStack's own
 * untouched-form `defaultValues` sync silently covering for a missing or
 * broken `useLiveFieldMerge`.
 */
function touchWithoutEditing(form: AnyFormApi, key: string): void {
  act(() => {
    form.setFieldValue(key, form.state.values[key]);
  });
}

describe("useLiveFieldMerge", () => {
  it("adopts a server change on an untouched field", () => {
    const initial = baseDocument();
    const { formRef, setDocument } = renderMergeHarness(initial);
    touchWithoutEditing(formRef.current!, "price");

    setDocument({ ...initial, name: "Renamed" });

    expect(formRef.current!.state.values.name).toBe("Renamed");
  });

  it("leaves an edited field alone when the server changes it", () => {
    const initial = baseDocument();
    const { formRef, setDocument } = renderMergeHarness(initial);
    act(() => {
      formRef.current!.setFieldValue("price", 25); // a real, unsaved edit
    });

    setDocument({ ...initial, price: 999 }); // another editor's save, same field

    expect(formRef.current!.state.values.price).toBe(25);
  });

  it("adopts untouched fields while preserving an edit in another field", () => {
    const initial = baseDocument();
    const { formRef, setDocument } = renderMergeHarness(initial);
    act(() => {
      formRef.current!.setFieldValue("price", 42);
    });

    setDocument({ ...initial, name: "Renamed", price: 999 });

    expect(formRef.current!.state.values.name).toBe("Renamed");
    expect(formRef.current!.state.values.price).toBe(42);
  });

  it("does not mark an adopted field dirty", () => {
    const initial = baseDocument();
    const { formRef, setDocument } = renderMergeHarness(initial);
    touchWithoutEditing(formRef.current!, "price");

    setDocument({ ...initial, name: "Renamed" });

    expect(isFieldKeyDirty(formRef.current!, "name")).toBe(false);
    expect(changedValues(formRef.current!)).not.toHaveProperty("name");
  });

  it("reports an adopted field as isDefaultValue, so it reads as a fresh load", () => {
    const initial = baseDocument();
    const { formRef, setDocument } = renderMergeHarness(initial);
    touchWithoutEditing(formRef.current!, "price");

    setDocument({ ...initial, name: "Renamed" });

    expect(formRef.current!.getFieldMeta("name")?.isDefaultValue).toBe(true);
    expect(formRef.current!.getFieldMeta("name")?.isDirty).toBe(false);
  });

  it("keeps Save disabled when only untouched fields changed server-side", () => {
    const initial = baseDocument();
    const { formRef, setDocument } = renderMergeHarness(initial);
    touchWithoutEditing(formRef.current!, "price");

    setDocument({ ...initial, name: "Renamed", tags: ["green"] });

    expect(formRef.current!.state.isDefaultValue).toBe(true);
  });

  it("resets to the live document, not the mount-time document", () => {
    const initial = baseDocument(); // price: 10
    const { formRef, setDocument } = renderMergeHarness(initial);
    act(() => {
      formRef.current!.setFieldValue("price", 42); // a real, unsaved edit
    });

    setDocument({ ...initial, name: "Renamed", price: 15 });

    act(() => {
      formRef.current!.reset();
    });

    // Not 10 (mount-time) and not 42 (the discarded edit) — the live value.
    expect(formRef.current!.state.values.price).toBe(15);
    expect(formRef.current!.state.values.name).toBe("Renamed");
  });

  it("treats a group field as edited when a nested leaf is edited", () => {
    const initial = baseDocument();
    const { formRef, setDocument } = renderMergeHarness(initial);
    act(() => {
      formRef.current!.setFieldValue("light.background", "black");
    });

    setDocument({ ...initial, light: { background: "purple" } });

    // `light` has no meta of its own; `isFieldKeyDirty` reads the registered
    // `light.background` leaf, so the merge does not clobber the edit.
    expect(isFieldKeyDirty(formRef.current!, "light")).toBe(true);
    expect(formRef.current!.state.values.light).toEqual({ background: "black" });
  });

  it("compares array-valued fields by content, not reference", () => {
    const initial = baseDocument(); // tags: ["red", "blue"]
    const { formRef, setDocument } = renderMergeHarness(initial);
    touchWithoutEditing(formRef.current!, "price");
    const before = formRef.current!.state.values.tags;

    // A new array instance with IDENTICAL content: `===` would report a change
    // every render for a `relationship`/`select` field; `eq` must not, so no
    // write happens and the reference is preserved.
    setDocument({ ...initial, tags: ["red", "blue"] });

    expect(formRef.current!.state.values.tags).toBe(before);
  });
});
