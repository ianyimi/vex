import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SaveListViewDialog } from "./SaveListViewDialog";

describe("SaveListViewDialog", () => {
  it("disables Save while the name is blank", () => {
    render(
      <SaveListViewDialog
        open
        onOpenChange={() => {}}
        mode="create"
        name=""
        description=""
        target="local"
        canCreateShared
        sharedViewsAvailable
        isPending={false}
        onSubmit={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });
  it("focuses the name input when opened, via a ref effect, not the autoFocus attribute", async () => {
    render(
      <SaveListViewDialog
        open
        onOpenChange={() => {}}
        mode="create"
        name=""
        description=""
        target="local"
        canCreateShared
        sharedViewsAvailable
        isPending={false}
        onSubmit={() => {}}
      />,
    );
    const input = screen.getByLabelText("Name");
    expect(input).not.toHaveAttribute("autofocus");
    await waitFor(() => expect(input).toHaveFocus());
  });

  it("associates each scope radio with its label via id/htmlFor, not nesting alone", () => {
    render(
      <SaveListViewDialog
        open
        onOpenChange={() => {}}
        mode="create"
        name=""
        description=""
        target="local"
        canCreateShared
        sharedViewsAvailable
        isPending={false}
        onSubmit={() => {}}
      />,
    );
    expect(screen.getByLabelText("Only you")).toHaveAttribute("id", "list-save-view-target-local");
    expect(screen.getByLabelText("Everyone with access")).toHaveAttribute(
      "id",
      "list-save-view-target-shared",
    );
  });

  it("submits the trimmed name/description/target in create mode", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <SaveListViewDialog
        open
        onOpenChange={() => {}}
        mode="create"
        name=""
        description=""
        target="local"
        canCreateShared
        sharedViewsAvailable
        isPending={false}
        onSubmit={onSubmit}
      />,
    );
    await user.type(screen.getByLabelText("Name"), "  My view  ");
    await user.type(screen.getByLabelText("Description"), "  notes  ");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSubmit).toHaveBeenCalledWith({ name: "My view", description: "notes", target: "local" });
  });

  it("shows a scope radio in create mode, disabling shared when canCreateShared is false", () => {
    render(
      <SaveListViewDialog
        open
        onOpenChange={() => {}}
        mode="create"
        name=""
        description=""
        target="local"
        canCreateShared={false}
        sharedViewsAvailable
        isPending={false}
        onSubmit={() => {}}
      />,
    );
    expect(screen.getByText("Everyone with access")).toBeInTheDocument();
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(2);
    expect(radios[1]).toHaveAttribute("aria-disabled", "true");
  });

  it("hides the scope radio and labels the Save button Rename in rename mode", () => {
    render(
      <SaveListViewDialog
        open
        onOpenChange={() => {}}
        mode="rename"
        name="Existing"
        description=""
        target="shared"
        canCreateShared
        sharedViewsAvailable
        isPending={false}
        onSubmit={() => {}}
      />,
    );
    expect(screen.queryByText("Who can see this view")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rename" })).toBeInTheDocument();
  });
});

describe("SaveListViewDialog — sharedViewsAvailable (org scoping)", () => {
  it("hides the 'Everyone with access' option entirely when sharedViewsAvailable is false, even with canCreateShared true", () => {
    render(
      <SaveListViewDialog
        open
        onOpenChange={() => {}}
        mode="create"
        name=""
        description=""
        target="local"
        canCreateShared
        sharedViewsAvailable={false}
        isPending={false}
        onSubmit={() => {}}
      />,
    );
    expect(screen.queryByText("Everyone with access")).not.toBeInTheDocument();
    // "Only you" still shows — hiding shared doesn't hide the whole scope field.
    expect(screen.getByText("Only you")).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(1);
  });

  it("always submits target local when sharedViewsAvailable is false, even if the incoming target prop is shared", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <SaveListViewDialog
        open
        onOpenChange={() => {}}
        mode="create"
        name="View"
        description=""
        target="shared"
        canCreateShared
        sharedViewsAvailable={false}
        isPending={false}
        onSubmit={onSubmit}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSubmit).toHaveBeenCalledWith({ name: "View", description: "", target: "local" });
  });
});
