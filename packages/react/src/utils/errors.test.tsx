import { createElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { act, render } from "@testing-library/react";
import { useForm } from "@tanstack/react-form";
import { ConvexError } from "convex/values";
import { applyVexFieldErrors } from "./errors";
import type { AnyFormApi } from "../forms";

/**
 * Mounts a real `useForm` instance with a `<form.Field>` registered for each
 * of `fieldNames` (so each one has a baseline `fieldMeta` entry — `setFieldMeta`'s
 * updater reads `prev.errorMap` unguarded, which only a field TanStack has already
 * registered is guaranteed to have, the same reason `useLiveFieldMerge.test.tsx`
 * pre-mounts its own probed fields) and returns the form, cast the same way every
 * other direct-`setFieldMeta` test in this package already does (`collapsible/Field.test.tsx`,
 * `tabs/Field.test.tsx`).
 */
function makeForm(defaultValues: Record<string, unknown>, fieldNames: string[]): AnyFormApi {
  const formRef: { current: AnyFormApi | undefined } = { current: undefined };
  function Harness(): ReactNode {
    const form = useForm({ defaultValues });
    formRef.current = form as AnyFormApi;
    return (
      <div>
        {fieldNames.map((name) => (
          <form.Field key={name} name={name}>
            {() => null}
          </form.Field>
        ))}
      </div>
    );
  }
  render(createElement(Harness));
  return formRef.current!;
}

describe("applyVexFieldErrors", () => {
  it("maps a single named field onto that field's own meta", () => {
    const form = makeForm({ title: "" }, ["title"]);
    act(() => {
      applyVexFieldErrors(form, new ConvexError({ message: "Title already taken", field: "title" }));
    });
    expect(form.state.fieldMeta.title?.errorMap.onSubmit).toBe("Title already taken");
  });

  it("joins a Zod issue's full path — an array index as `[n]`, not just the top-level field", () => {
    const form = makeForm({ tagList: [""] }, ["tagList[0]"]);
    const issues = [{ path: ["tagList", 0], message: "This field is required." }];
    act(() => {
      applyVexFieldErrors(
        form,
        new ConvexError({ message: "Validation failed", errors: JSON.stringify(issues) }),
      );
    });
    expect(form.state.fieldMeta["tagList[0]"]?.errorMap.onSubmit).toBe("This field is required.");
    // Before this fix, `applyVexFieldErrors` took only `path[0]` — the array
    // itself, never the specific item — so the top-level key must stay clean.
    expect(form.state.fieldMeta.tagList).toBeUndefined();
  });

  it("joins a nested group path with a dot after an object-key segment", () => {
    const form = makeForm({ address: { city: "" } }, ["address.city"]);
    const issues = [{ path: ["address", "city"], message: "This field is required." }];
    act(() => {
      applyVexFieldErrors(
        form,
        new ConvexError({ message: "Validation failed", errors: JSON.stringify(issues) }),
      );
    });
    expect(form.state.fieldMeta["address.city"]?.errorMap.onSubmit).toBe("This field is required.");
  });

  it("joins a blocks-item nested field: array index then dotted key", () => {
    const form = makeForm({ content: [{ body: "" }, { body: "" }, { body: "" }] }, ["content[2].body"]);
    const issues = [{ path: ["content", 2, "body"], message: "This field is required." }];
    act(() => {
      applyVexFieldErrors(
        form,
        new ConvexError({ message: "Validation failed", errors: JSON.stringify(issues) }),
      );
    });
    expect(form.state.fieldMeta["content[2].body"]?.errorMap.onSubmit).toBe("This field is required.");
  });

  it("is a no-op for a non-ConvexError", () => {
    const form = makeForm({ title: "" }, ["title"]);
    act(() => {
      applyVexFieldErrors(form, new Error("boom"));
    });
    expect(form.state.fieldMeta.title?.errorMap.onSubmit).toBeUndefined();
  });
});
