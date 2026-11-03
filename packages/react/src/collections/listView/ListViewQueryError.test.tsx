import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { VexError } from "@vexcms/core";
import { ConvexError } from "convex/values";
import { ListViewQueryError } from "./ListViewQueryError";

describe("ListViewQueryError", () => {
  it("renders the generic message and Try again for a plain error", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(
      <ListViewQueryError
        error={new Error("network down")}
        collectionLabelPlural="testimonials"
        onRetry={onRetry}
      />,
    );
    expect(screen.getByText("Couldn't load testimonials")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("renders the UNINDEXED_SORT message with the field label and Remove sort", async () => {
    const onRemoveSort = vi.fn();
    const user = userEvent.setup();
    const error = new VexError({ code: "UNINDEXED_SORT", message: "rating has no leading index" });
    render(
      <ListViewQueryError
        error={error}
        collectionLabelPlural="testimonials"
        onRetry={vi.fn()}
        sortFieldLabel="Rating"
        onRemoveSort={onRemoveSort}
      />,
    );
    expect(screen.getByText("Can't sort by Rating yet")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /remove sort/i }));
    expect(onRemoveSort).toHaveBeenCalled();
  });

  it("falls back to the generic message for a non-UNINDEXED_SORT VexError", () => {
    const error = new VexError({ code: "SEARCH_FIELD_NOT_ALLOWED", message: "nope" });
    render(
      <ListViewQueryError error={error} collectionLabelPlural="testimonials" onRetry={vi.fn()} />,
    );
    expect(screen.getByText("Couldn't load testimonials")).toBeInTheDocument();
  });

  it("shows the raw error in a details disclosure", () => {
    render(
      <ListViewQueryError
        error={new Error("network down")}
        collectionLabelPlural="testimonials"
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getByText(/network down/)).toBeInTheDocument();
  });

  it("renders the UNINDEXED_SORT message from a plain server-seeded { code, message } object, not just a real VexError", async () => {
    const onRemoveSort = vi.fn();
    const user = userEvent.setup();
    render(
      <ListViewQueryError
        error={{ code: "UNINDEXED_SORT", message: "title has no leading index" }}
        collectionLabelPlural="posts"
        onRetry={vi.fn()}
        sortFieldLabel="Title"
        onRemoveSort={onRemoveSort}
      />,
    );
    expect(screen.getByText("Can't sort by Title yet")).toBeInTheDocument();
    expect(screen.getByText(/title has no leading index/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /remove sort/i }));
    expect(onRemoveSort).toHaveBeenCalled();
  });

  it("renders the UNINDEXED_SORT message from a REAL client-caught ConvexError whose VexError subclass identity was lost crossing the wire (plain ConvexError, not VexError)", async () => {
    const onRemoveSort = vi.fn();
    const user = userEvent.setup();
    const error = new ConvexError({ code: "UNINDEXED_SORT", message: "title has no leading index" });
    render(
      <ListViewQueryError
        error={error}
        collectionLabelPlural="posts"
        onRetry={vi.fn()}
        sortFieldLabel="Title"
        onRemoveSort={onRemoveSort}
      />,
    );
    expect(screen.getByText("Can't sort by Title yet")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /remove sort/i }));
    expect(onRemoveSort).toHaveBeenCalled();
  });

  it("renders the UNINDEXED_SORT message from a local Convex dev server's own diagnostic-string-wrapped ConvexError (confirmed live)", () => {
    const devServerError = new ConvexError(
      '[CONVEX Q(vex:find)] [Request ID: abc123] Server Error\n' +
        'Uncaught VexError: {"code":"UNINDEXED_SORT","collection":"posts","field":"title","message":"sort.field \\"title\\" leads no index."}\n' +
        '    at resolveQueryIndex2 (../../../../packages/core/src/collections/resolveQueryIndex.ts:210:6)',
    );
    render(
      <ListViewQueryError
        error={devServerError}
        collectionLabelPlural="posts"
        onRetry={vi.fn()}
        sortFieldLabel="Title"
      />,
    );
    expect(screen.getByText("Can't sort by Title yet")).toBeInTheDocument();
    expect(screen.getByText(/sort\.field "title" leads no index\./)).toBeInTheDocument();
    expect(screen.queryByText(/resolveQueryIndex/)).not.toBeInTheDocument();
  });
});
