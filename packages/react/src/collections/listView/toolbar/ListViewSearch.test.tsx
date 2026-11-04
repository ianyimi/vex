import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineCollection, text } from "@vexcms/core";
import { ListViewSearch } from "./ListViewSearch";

const baseFields = {
  title: text({ required: false, searchIndex: { name: "search_title", filterFields: [] } }),
  body: text({ required: false, searchIndex: { name: "search_body", filterFields: [] } }),
};

describe("ListViewSearch", () => {
  it("renders nothing when the collection has no searchField", () => {
    const collection = defineCollection({ slug: "search_test_none", fields: baseFields });
    const { container } = render(
      <ListViewSearch
        collection={collection}
        q=""
        qf={undefined}
        onQChange={vi.fn()}
        onQfChange={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the input alone for a single-entry searchField", () => {
    const collection = defineCollection({
      slug: "search_test_one",
      fields: baseFields,
      admin: { view: { searchFields: ["title"] } },
    });
    render(
      <ListViewSearch
        collection={collection}
        q=""
        qf="title"
        onQChange={vi.fn()}
        onQfChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("renders a field picker for a multi-entry searchField", () => {
    const collection = defineCollection({
      slug: "search_test_multi",
      fields: baseFields,
      admin: { view: { searchFields: ["title", "body"] } },
    });
    render(
      <ListViewSearch
        collection={collection}
        q=""
        qf="title"
        onQChange={vi.fn()}
        onQfChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  // Flaky under parallel/CPU-contended load (failed in the
  // full `pnpm test`/turbo run, passed in isolation) — the production
  // debounce (`useDebouncedValue`'s own internal `setTimeout`) and this
  // test's own `waitFor` both depended on REAL wall-clock time. Under
  // light load, 600ms comfortably beats the 250ms debounce; under heavy
  // CPU contention from the rest of the parallel suite, the event loop
  // can genuinely delay a real timer well past that margin — a longer
  // timeout only narrows the window, it doesn't close it. Fake timers
  // (this codebase's own established pattern for exactly this —
  // `useListViewPeekPrefetch.test.ts`/`useAutosave.test.tsx`) make the
  // debounce's own timing deterministic regardless of real CPU
  // scheduling: `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })`
  // lets `user.type()` drive its own internal per-keystroke delays
  // through the FAKE clock (the documented `user-event` + fake-timers
  // pairing), then one explicit `act(() => vi.advanceTimersByTime(250))`
  // fires the debounce itself and flushes the resulting `onQChange`
  // effect synchronously — no race, no wall-clock dependency either way.
  // Scoped to its OWN `describe` (`beforeEach`/`afterEach` around just
  // this one test, not the file's other three, none of which have a
  // timer dependency at all) so fake timers can never leak into a
  // sibling test even if this one throws.
  describe("debounce timing (deterministic, fake timers)", () => {
    beforeEach(() => {
      // `shouldAdvanceTime: true` (Sinon's own fake-timers option, Vitest
      // forwards it) makes the fake clock auto-advance in small real-time
      // increments for `userEvent`'s own internal per-keystroke delays —
      // `advanceTimers: vi.advanceTimersByTime` alone (the more commonly
      // documented pairing) deadlocked here (`user.type` never resolved,
      // 15s timeout) rather than driving them. The LONGER, deliberate
      // 250ms debounce wait still needs an explicit
      // `vi.advanceTimersByTime(250)` below — `shouldAdvanceTime` only
      // covers time passing as code actually runs, never a wait nothing
      // is doing anything during.
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("debounces onQChange 250ms after typing, with push defaulting falsy", async () => {
      const collection = defineCollection({
        slug: "search_test_debounce",
        fields: baseFields,
        admin: { view: { searchFields: ["title"] } },
      });
      const onQChange = vi.fn();
      const user = userEvent.setup();
      render(
        <ListViewSearch
          collection={collection}
          q=""
          qf="title"
          onQChange={onQChange}
          onQfChange={vi.fn()}
        />,
      );
      await user.type(screen.getByRole("textbox"), "hello");
      expect(onQChange).not.toHaveBeenCalled();
      act(() => {
        vi.advanceTimersByTime(250);
      });
      expect(onQChange).toHaveBeenCalledWith("hello");
    });
  });

  it("Enter commits immediately and pushes", async () => {
    const collection = defineCollection({
      slug: "search_test_enter",
      fields: baseFields,
      admin: { view: { searchFields: ["title"] } },
    });
    const onQChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ListViewSearch
        collection={collection}
        q=""
        qf="title"
        onQChange={onQChange}
        onQfChange={vi.fn()}
      />,
    );
    await user.type(screen.getByRole("textbox"), "hello{Enter}");
    expect(onQChange).toHaveBeenCalledWith("hello", { push: true });
  });

  it("Escape with text clears the query", async () => {
    const collection = defineCollection({
      slug: "search_test_escape",
      fields: baseFields,
      admin: { view: { searchFields: ["title"] } },
    });
    const onQChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ListViewSearch
        collection={collection}
        q="hello"
        qf="title"
        onQChange={onQChange}
        onQfChange={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("textbox"));
    await user.keyboard("{Escape}");
    expect(onQChange).toHaveBeenCalledWith("");
  });

  it("calls onQfChange immediately on field selection, no debounce", async () => {
    const collection = defineCollection({
      slug: "search_test_field_change",
      fields: baseFields,
      admin: { view: { searchFields: ["title", "body"] } },
    });
    const onQfChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ListViewSearch
        collection={collection}
        q="hello"
        qf="title"
        onQChange={vi.fn()}
        onQfChange={onQfChange}
      />,
    );
    await user.click(screen.getByRole("combobox"));
    // `findByRole` (not `getByRole`): the option list mounts into a
    // floating-ui-positioned portal one tick after the trigger click
    // settles — the SAME race `ListViewFilterBuilder.test.tsx`'s own
    // `pickOp` helper already documents and avoids for the identical
    // reason. Asserting synchronously right after the click only looked
    // safe in isolation (the portal mount microtask settles within the
    // SAME tick when nothing else is contending for the event loop);
    // under full-suite CPU contention it's a genuine race — this test's
    // own share of flakiness alongside the debounce one
    // above, caught the same way: a full-suite run (not isolation)
    // failed here specifically.
    await user.click(await screen.findByRole("option", { name: "body" }));
    expect(onQfChange).toHaveBeenCalledWith("body");
  });
});
