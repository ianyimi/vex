import { render, screen } from "@testing-library/react";
import { act } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";

beforeAll(() => {
  // cmdk observes its list for virtual sizing; jsdom has no ResizeObserver.
  class ResizeObserverStub {
    disconnect() {}
    observe() {}
    unobserve() {}
  }
  globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;
  // cmdk scrolls the highlighted item into view; jsdom has no layout.
  Element.prototype.scrollIntoView ??= () => undefined;
});

import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "./multi-select";

/**
 * The admin's `select` field renders inside the collection edit `<form>`, and
 * every page carrying one is scrollable. Two separate hazards are pinned here;
 * either one made a `select` below the fold impossible to use.
 */
describe("MultiSelect", () => {
  const renderInForm = (
    onSubmit: (event: { preventDefault: () => void }) => void,
    props: { modal?: boolean } = {},
  ) =>
    render(
      <form onSubmit={onSubmit}>
        <MultiSelect {...props}>
          <MultiSelectTrigger>
            <MultiSelectValue placeholder="Pick one" />
          </MultiSelectTrigger>
        </MultiSelect>
      </form>,
    );

  it("renders a trigger that cannot submit its surrounding form", () => {
    // A <button> with no `type` defaults to type="submit".
    renderInForm(() => undefined);
    expect(screen.getByRole("combobox").getAttribute("type")).toBe("button");
  });

  it("does not submit the surrounding form when opened", () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => {
      event.preventDefault();
    });
    renderInForm(onSubmit);

    act(() => screen.getByRole("combobox").click());

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("does not lock page scroll when opened", () => {
    // Base UI runs `useScrollLock` when `modal === true`. That lock sets
    // `body { position: relative }` and compensates by writing
    // `body.scrollTop` — which misses when the page scrolls on <html>, the
    // normal case. `html.scrollTop` then collapses to 0, the view snaps to the
    // top, the trigger goes offscreen, and the popover closes. A form field
    // must stay non-modal by default.
    renderInForm(() => undefined);

    act(() => screen.getByRole("combobox").click());

    expect(document.body.style.position).not.toBe("relative");
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  // The modal opt-in is deliberately not asserted through `body.style` here:
  // Base UI's scroll lock only writes those styles when the document is
  // actually scrollable, which jsdom does not model. The opt-in path is
  // covered by `useModalSurface`'s own test instead.
});

/**
 * Focus is managed by `MultiSelectContent` itself with `preventScroll`, not by
 * the popover's initial-focus behaviour. A floating popup is positioned a
 * frame after it mounts; a plain focus() landing inside it during that window
 * natively scrolls the page to the popup's pre-position location — measured
 * as a 1381px jump when the trigger sat below the fold. `preventScroll`
 * removes the race rather than trying to win it. These tests pin that taking
 * focus away from the popover did not lose it altogether.
 */
describe("MultiSelectContent focus", () => {
  const flushFrames = async () => {
    // The focus effect schedules two animation frames.
    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
      await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  };

  it("focuses the search input after opening", async () => {
    render(
      <MultiSelect>
        <MultiSelectTrigger>
          <MultiSelectValue placeholder="Pick" />
        </MultiSelectTrigger>
        <MultiSelectContent>
          <MultiSelectItem value="a">A</MultiSelectItem>
        </MultiSelectContent>
      </MultiSelect>,
    );

    act(() => screen.getByRole("combobox").click());
    await flushFrames();

    expect(document.activeElement?.getAttribute("data-slot")).toBe("command-input");
  });

  it("focuses the hidden keyboard target when search is off", async () => {
    render(
      <MultiSelect>
        <MultiSelectTrigger>
          <MultiSelectValue placeholder="Pick" />
        </MultiSelectTrigger>
        <MultiSelectContent search={false}>
          <MultiSelectItem value="a">A</MultiSelectItem>
        </MultiSelectContent>
      </MultiSelect>,
    );

    act(() => screen.getByRole("combobox").click());
    await flushFrames();

    expect(document.activeElement?.hasAttribute("data-multiselect-focus")).toBe(true);
  });
});
