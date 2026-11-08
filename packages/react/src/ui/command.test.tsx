import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it } from "vitest";

import { expectNoA11yViolations } from "../testing/a11y";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";

beforeAll(() => {
  Element.prototype.scrollIntoView ??= () => undefined;
});

function renderCommand() {
  return render(
    <Command label="Search commands">
      <CommandInput placeholder="Search..." />
      <CommandList>
        <CommandEmpty>No results</CommandEmpty>
        <CommandGroup heading="Documents">
          <CommandItem>Pages</CommandItem>
          <CommandItem>Posts</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>,
  );
}

describe("Command", () => {
  it("has no detectable accessibility violations", async () => {
    const { container } = renderCommand();
    await expectNoA11yViolations(container);
  });

  it("highlights the first item by default, then moves with ArrowDown/ArrowUp", async () => {
    const user = userEvent.setup();
    renderCommand();
    const input = screen.getByRole("combobox", { name: "Search commands" });
    input.focus();
    expect(screen.getByRole("option", { name: "Pages" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("option", { name: "Posts" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await user.keyboard("{ArrowUp}");
    expect(screen.getByRole("option", { name: "Pages" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("filters items by typed text", async () => {
    const user = userEvent.setup();
    renderCommand();
    const input = screen.getByRole("combobox", { name: "Search commands" });
    await user.type(input, "Post");
    expect(screen.queryByRole("option", { name: "Pages" })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Posts" })).toBeInTheDocument();
  });
});
