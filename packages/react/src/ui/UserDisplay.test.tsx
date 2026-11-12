import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { icons } from "lucide-react";
import { IconComponentsProvider } from "./Icon";
import { UserDisplay } from "./UserDisplay";

describe("UserDisplay", () => {
  it("renders the name as the header line and the email underneath as the subline", () => {
    render(<UserDisplay name="Ada Lovelace" email="ada@example.com" />);
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    const email = screen.getByText("ada@example.com");
    expect(email).toBeInTheDocument();
    expect(email.className).toContain("text-muted-foreground");
  });

  it("shows only the email as the single visible line when no name is set", () => {
    render(<UserDisplay email="ada@example.com" />);
    expect(screen.getAllByText("ada@example.com")).toHaveLength(1);
  });

  it("renders nothing when neither a name nor an email is given", () => {
    const { container } = render(<UserDisplay />);
    expect(container).toBeEmptyDOMElement();
  });

  it("uses the user's own image for the avatar when present, even with a fallbackIcon also given", () => {
    const { container } = render(
      <UserDisplay name="Ada" image="https://example.com/avatar.png" fallbackIcon="Users" />,
    );
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("src", "https://example.com/avatar.png");
    expect(container.querySelector("svg")).toBeNull();
  });

  it("falls back to the caller-provided icon (the user collection's configured admin.icon) when there is no image", () => {
    const { container } = render(
      <IconComponentsProvider icons={icons}>
        <UserDisplay name="Ada" fallbackIcon="Users" />
      </IconComponentsProvider>,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("svg")!.getAttribute("class")).toContain("lucide-users");
  });

  it("falls back to the generic single-user icon when there is no image and no fallbackIcon", () => {
    const { container } = render(
      <IconComponentsProvider icons={icons}>
        <UserDisplay name="Ada" />
      </IconComponentsProvider>,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("svg")!.getAttribute("class")).toContain("lucide-user");
  });
});
