import { describe, expect, test } from "vitest";

import { globalSingleton } from "./globalSingleton";

describe("globalSingleton", () => {
  test("returns the same object on every call for the same key", () => {
    const a = globalSingleton("globalSingleton.test/same-key", () => ({}));
    const b = globalSingleton("globalSingleton.test/same-key", () => ({}));
    expect(a).toBe(b);
  });

  test("never re-runs create once a key has a value", () => {
    let calls = 0;
    const build = () => {
      calls += 1;
      return { calls };
    };
    const first = globalSingleton("globalSingleton.test/create-once", build);
    const second = globalSingleton("globalSingleton.test/create-once", build);
    expect(calls).toBe(1);
    expect(first).toBe(second);
  });

  test("different keys get different, independent values", () => {
    const a = globalSingleton("globalSingleton.test/key-a", () => ({ id: "a" }));
    const b = globalSingleton("globalSingleton.test/key-b", () => ({ id: "b" }));
    expect(a).not.toBe(b);
    expect(a).toEqual({ id: "a" });
    expect(b).toEqual({ id: "b" });
  });

  test("simulates a duplicated module copy: a fresh call site with the same key still converges", () => {
    // Two "copies" of a context module, as if Turbopack had evaluated the
    // defining file's factory twice — each builds its own createContext-like
    // object, but both must resolve to the first one built.
    const copyOne = globalSingleton("globalSingleton.test/duplicated-module", () => ({
      marker: "copy-one",
    }));
    const copyTwo = globalSingleton("globalSingleton.test/duplicated-module", () => ({
      marker: "copy-two",
    }));
    expect(copyTwo).toBe(copyOne);
    expect(copyTwo.marker).toBe("copy-one");
  });
});
