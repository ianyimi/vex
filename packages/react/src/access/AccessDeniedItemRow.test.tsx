import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AccessDeniedItemRow } from "./AccessDeniedItemRow";

describe("AccessDeniedItemRow", () => {
  it("renders a muted 'Hidden {label}' row with no raw error message on screen", () => {
    render(<AccessDeniedItemRow resource="user" action="read" label="User" />);
    expect(screen.getByText("Hidden User")).toBeInTheDocument();
  });

  it("exposes the denied permission as resource/action via the info button's accessible name", () => {
    render(<AccessDeniedItemRow resource="user" action="read" label="User" />);
    expect(screen.getByRole("button", { name: "Requires user/read" })).toBeInTheDocument();
  });

  it("includes the field when the denial is field-scoped", () => {
    render(<AccessDeniedItemRow resource="user" action="read" field="email" label="User" />);
    expect(
      screen.getByRole("button", { name: "Requires user/read (field: email)" }),
    ).toBeInTheDocument();
  });
});
