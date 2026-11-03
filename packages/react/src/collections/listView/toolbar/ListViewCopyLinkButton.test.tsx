import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ListViewCopyLinkButton } from "./ListViewCopyLinkButton";

const writeText = vi.fn().mockResolvedValue(undefined);

// `userEvent.setup()` installs its own clipboard stub (a getter-only
// `navigator.clipboard` accessor) on every call — defining a mock BEFORE
// setup gets shadowed. Redefine it per-test, after setup, instead.
function setupUser() {
  const user = userEvent.setup();
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
  return user;
}

afterEach(() => writeText.mockClear());

describe("ListViewCopyLinkButton", () => {
  it("copies window.location.href by default", async () => {
    const user = setupUser();
    render(<ListViewCopyLinkButton />);
    await user.click(screen.getByRole("button", { name: /copy link/i }));
    expect(writeText).toHaveBeenCalledWith(window.location.href);
  });

  it("copies buildHref's return value when provided", async () => {
    const user = setupUser();
    const buildHref = vi.fn().mockReturnValue("https://example.com/admin/testimonials?q=ma");
    render(<ListViewCopyLinkButton buildHref={buildHref} />);
    await user.click(screen.getByRole("button", { name: /copy link/i }));
    expect(writeText).toHaveBeenCalledWith("https://example.com/admin/testimonials?q=ma");
  });
});
