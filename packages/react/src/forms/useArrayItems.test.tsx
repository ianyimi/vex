import { describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useArrayItems, type ArrayItemsField } from "./useArrayItems";

function makeField(initial: string[]): ArrayItemsField<string> & { value: string[] } {
  const state = { value: [...initial] };
  return {
    state,
    get value() {
      return state.value;
    },
    pushValue: (item) => {
      state.value = [...state.value, item];
    },
    insertValue: (index, item) => {
      const next = [...state.value];
      next.splice(index, 0, item);
      state.value = next;
    },
    removeValue: (index) => {
      const next = [...state.value];
      next.splice(index, 1);
      state.value = next;
    },
    moveValue: (from, to) => {
      const next = [...state.value];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved!);
      state.value = next;
    },
    handleChange: (next) => {
      state.value = [...next];
    },
  };
}

describe("useArrayItems", () => {
  it("adds a new item and a matching key", () => {
    const field = makeField(["a"]);
    const { result, rerender } = renderHook(
      (props: { field: typeof field }) => useArrayItems({ field: props.field, createItem: () => "b" }),
      { initialProps: { field } },
    );
    act(() => result.current.add());
    rerender({ field });
    expect(field.value).toEqual(["a", "b"]);
    expect(result.current.itemKeys).toHaveLength(2);
  });

  it("duplicates an item immediately after itself with a fresh key", () => {
    const field = makeField(["a", "b"]);
    const { result, rerender } = renderHook(
      (props: { field: typeof field }) =>
        useArrayItems({ field: props.field, createItem: () => "x" }),
      { initialProps: { field } },
    );
    const keysBefore = result.current.itemKeys;
    act(() => result.current.duplicate(0));
    rerender({ field });
    expect(field.value).toEqual(["a", "a", "b"]);
    expect(result.current.itemKeys[0]).toBe(keysBefore[0]);
    expect(result.current.itemKeys[1]).not.toBe(keysBefore[1]);
  });

  it("reports atMax once the length reaches max", () => {
    const field = makeField(["a", "b"]);
    const { result } = renderHook(() => useArrayItems({ field, createItem: () => "x", max: 2 }));
    expect(result.current.atMax).toBe(true);
  });

  it("moveUp/moveDown are no-ops past the array's bounds", () => {
    const field = makeField(["a", "b"]);
    const { result, rerender } = renderHook(
      (props: { field: typeof field }) =>
        useArrayItems({ field: props.field, createItem: () => "x" }),
      { initialProps: { field } },
    );
    act(() => result.current.moveUp(0));
    rerender({ field });
    expect(field.value).toEqual(["a", "b"]);
    act(() => result.current.moveDown(1));
    rerender({ field });
    expect(field.value).toEqual(["a", "b"]);
  });

  it("bumps openSignal's version on collapseAll/expandAll", () => {
    const field = makeField(["a"]);
    const { result } = renderHook(() => useArrayItems({ field, createItem: () => "x" }));
    expect(result.current.openSignal).toEqual({ version: 0, open: true });
    act(() => result.current.collapseAll());
    expect(result.current.openSignal).toEqual({ version: 1, open: false });
  });
});

describe("useArrayItems: stored-id keying and multi-item mutators", () => {
  it("keys an object-shaped item by its own stored id, independent of position", () => {
  type Item = { id: string; title: string };
  const initial: Item[] = [
    { id: "x1", title: "first" },
    { id: "x2", title: "second" },
  ];
  const state = { value: [...initial] };
  const field: ArrayItemsField<Item> = {
    state,
    pushValue: (item) => (state.value = [...state.value, item]),
    insertValue: (index, item) => {
      const next = [...state.value];
      next.splice(index, 0, item);
      state.value = next;
    },
    removeValue: (index) => {
      const next = [...state.value];
      next.splice(index, 1);
      state.value = next;
    },
    moveValue: (from, to) => {
      const next = [...state.value];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved!);
      state.value = next;
    },
    handleChange: (next) => (state.value = [...next]),
  };
  const { result, rerender } = renderHook(() =>
    useArrayItems({ field, createItem: () => ({ id: "new", title: "" }), getStoredId: (item) => item.id }),
  );
  const keysBefore = result.current.itemKeys;
  expect(keysBefore).toEqual(["x1", "x2"]);

  // Mutation bypasses the hook's own mutators entirely (e.g. an admin-layer
  // keyboard action calling the raw field API directly) — the stored-id key
  // must still follow each item correctly since it is read from the item
  // itself every render, not tracked positionally.
  field.moveValue(0, 1);
  rerender();
  expect(state.value.map((item) => item.id)).toEqual(["x2", "x1"]);
  expect(result.current.itemKeys).toEqual(["x2", "x1"]);
  });

  it("pushMany appends several items at the tail with fresh keys", () => {
  const field = makeField(["a"]);
  const { result, rerender } = renderHook(() => useArrayItems({ field, createItem: () => "x" }));
  act(() => result.current.pushMany(["b", "c"]));
  rerender();
  expect(field.value).toEqual(["a", "b", "c"]);
  expect(result.current.itemKeys).toHaveLength(3);
  expect(new Set(result.current.itemKeys).size).toBe(3);
  });

  it("insertMany splices several items at a non-tail index, keeping itemKeys aligned", () => {
  const field = makeField(["a", "d"]);
  const { result, rerender } = renderHook(() => useArrayItems({ field, createItem: () => "x" }));
  const keyA = result.current.itemKeys[0];
  const keyD = result.current.itemKeys[1];
  act(() => result.current.insertMany(1, ["b", "c"]));
  rerender();
  expect(field.value).toEqual(["a", "b", "c", "d"]);
  expect(result.current.itemKeys[0]).toBe(keyA);
  expect(result.current.itemKeys[3]).toBe(keyD);
  expect(result.current.itemKeys).toHaveLength(4);
  });

  it("replaceAll regenerates every key for the new array", () => {
  const field = makeField(["a", "b"]);
  const { result, rerender } = renderHook(() => useArrayItems({ field, createItem: () => "x" }));
  const keysBefore = result.current.itemKeys;
  act(() => result.current.replaceAll(["c", "d", "e"]));
  rerender();
  expect(field.value).toEqual(["c", "d", "e"]);
  expect(result.current.itemKeys).toHaveLength(3);
  expect(result.current.itemKeys[0]).not.toBe(keysBefore[0]);
});
});
