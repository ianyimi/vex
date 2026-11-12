import { render, screen, waitFor } from "@testing-library/react";
import { act } from "react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { expectNoA11yViolations } from "../testing/a11y";

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

describe("MultiSelect a11y", () => {
  // See ui/select.test.tsx for why this is disabled: jsdom's
  // `navigator.vendor` trips Base UI's `isSafari` detection, the only
  // condition under which its internal FocusGuard span (inserted by the
  // `Popover` this component composes) gets a `role` with no accessible
  // name.
  const FOCUS_GUARD_JSDOM_SAFARI_RULES = { "aria-command-name": { enabled: false } };

  it("has no detectable accessibility violations while open with a selection", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <MultiSelect defaultValues={["a"]}>
        <MultiSelectTrigger aria-label="Tags">
          <MultiSelectValue placeholder="Pick tags" />
        </MultiSelectTrigger>
        <MultiSelectContent>
          <MultiSelectItem value="a">Alpha</MultiSelectItem>
          <MultiSelectItem value="b">Beta</MultiSelectItem>
        </MultiSelectContent>
      </MultiSelect>,
    );
    await user.click(screen.getByRole("combobox", { name: "Tags" }));
    await screen.findByRole("option", { name: "Alpha" });
    await expectNoA11yViolations(container, { rules: FOCUS_GUARD_JSDOM_SAFARI_RULES });
  });

  it("exposes role=combobox and aria-expanded on the trigger", () => {
    render(
      <MultiSelect defaultValues={["Alpha"]}>
        <MultiSelectTrigger aria-label="Tags">
          <MultiSelectValue placeholder="Pick tags" />
        </MultiSelectTrigger>
      </MultiSelect>,
    );
    const trigger = screen.getByRole("combobox", { name: "Tags" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("the chip remove button is not nested inside the trigger button (no axe nested-interactive)", () => {
    const { container } = render(
      <MultiSelect defaultValues={["Alpha"]}>
        <MultiSelectTrigger aria-label="Tags">
          <MultiSelectValue placeholder="Pick tags" />
        </MultiSelectTrigger>
      </MultiSelect>,
    );
    const trigger = screen.getByRole("combobox", { name: "Tags" });
    const remove = screen.getByRole("button", { name: "Remove Alpha" });
    expect(trigger.contains(remove)).toBe(false);
    expect(container.querySelectorAll("button, [role=button]")).toHaveLength(2);
  });

  it("reaches the chip remove button via real Tab order, then the combobox trigger", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Before</button>
        <MultiSelect defaultValues={["Alpha"]}>
          <MultiSelectTrigger aria-label="Tags">
            <MultiSelectValue placeholder="Pick tags" />
          </MultiSelectTrigger>
        </MultiSelect>
      </>,
    );
    const before = screen.getByRole("button", { name: "Before" });
    const remove = screen.getByRole("button", { name: "Remove Alpha" });
    const trigger = screen.getByRole("combobox", { name: "Tags" });

    before.focus();
    await user.tab();
    expect(document.activeElement).toBe(remove);
    await user.tab();
    expect(document.activeElement).toBe(trigger);
  });

  it("removes a selected chip with the keyboard, reached via real Tab order", async () => {
    const user = userEvent.setup();
    render(
      <MultiSelect defaultValues={["Alpha"]}>
        <MultiSelectTrigger aria-label="Tags">
          <MultiSelectValue placeholder="Pick tags" />
        </MultiSelectTrigger>
      </MultiSelect>,
    );
    await user.tab();
    expect(screen.getByRole("button", { name: "Remove Alpha" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.queryByRole("button", { name: "Remove Alpha" })).not.toBeInTheDocument();
  });
});

/**
 * The bug this guards: `MultiSelectTrigger` used to wrap only the 16px
 * chevron in `PopoverTrigger`, so `MultiSelectContent`'s `w-(--anchor-width)`
 * sized the popup to that chevron — an effectively invisible popup — and
 * clicking anywhere else in the field row did nothing.
 */
describe("MultiSelect popup anchoring and row click", () => {
  const rect = (width: number): DOMRect =>
    ({
      width,
      height: 36,
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: width,
      bottom: 36,
      toJSON: () => ({}),
    }) as DOMRect;

  it("anchors the popup's --anchor-width to the full trigger row, not just the inner combobox button", async () => {
    const user = userEvent.setup();
    render(
      <MultiSelect>
        <MultiSelectTrigger aria-label="Tags">
          <MultiSelectValue placeholder="Pick tags" />
        </MultiSelectTrigger>
        <MultiSelectContent>
          <MultiSelectItem value="a">Alpha</MultiSelectItem>
        </MultiSelectContent>
      </MultiSelect>,
    );
    const combobox = screen.getByRole("combobox", { name: "Tags" });
    const row = combobox.parentElement!;
    // The row (the field's full width) and the inner combobox button (just
    // the chevron) get distinguishable mocked widths — jsdom's real layout
    // always measures zero — so only whichever one is wired up as the
    // positioner's `anchor` can produce a 300px `--anchor-width`.
    row.getBoundingClientRect = () => rect(300);
    combobox.getBoundingClientRect = () => rect(16);

    await user.click(combobox);
    await screen.findByRole("option", { name: "Alpha" });

    await waitFor(() => {
      const anchored = Array.from(document.querySelectorAll<HTMLElement>("*")).find((el) =>
        el.style.getPropertyValue("--anchor-width"),
      );
      expect(anchored?.style.getPropertyValue("--anchor-width")).toBe("300px");
    });
  });

  it("opens when clicking the row's non-interactive area, not just the trigger button", async () => {
    const user = userEvent.setup();
    render(
      <MultiSelect>
        <MultiSelectTrigger aria-label="Tags">
          <MultiSelectValue placeholder="Pick tags" />
        </MultiSelectTrigger>
        <MultiSelectContent>
          <MultiSelectItem value="a">Alpha</MultiSelectItem>
        </MultiSelectContent>
      </MultiSelect>,
    );
    const combobox = screen.getByRole("combobox", { name: "Tags" });
    expect(combobox).toHaveAttribute("aria-expanded", "false");

    // "Pick tags" is the placeholder text rendered by `MultiSelectValue`, a
    // sibling of the combobox button inside the row — not the button itself.
    await user.click(screen.getByText("Pick tags"));

    expect(combobox).toHaveAttribute("aria-expanded", "true");
    await screen.findByRole("option", { name: "Alpha" });
  });

  it("opens on ArrowDown while the combobox button has focus", async () => {
    const user = userEvent.setup();
    render(
      <MultiSelect>
        <MultiSelectTrigger aria-label="Tags">
          <MultiSelectValue placeholder="Pick tags" />
        </MultiSelectTrigger>
        <MultiSelectContent>
          <MultiSelectItem value="a">Alpha</MultiSelectItem>
        </MultiSelectContent>
      </MultiSelect>,
    );
    const combobox = screen.getByRole("combobox", { name: "Tags" });
    combobox.focus();
    expect(combobox).toHaveAttribute("aria-expanded", "false");

    await user.keyboard("{ArrowDown}");

    expect(combobox).toHaveAttribute("aria-expanded", "true");
  });
});
