import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { ImageUpload } from "./ImageUpload";

afterEach(cleanup);

describe("ImageUpload — URL tab", () => {
  it("focuses the URL field on mount via a ref effect, not the autoFocus attribute, and labels both fields", () => {
    render(<ImageUpload onClose={vi.fn()} onInsertUrl={vi.fn()} />);
    const urlInput = screen.getByLabelText("Image URL");
    expect(urlInput.hasAttribute("autofocus")).toBe(false);
    expect(document.activeElement).toBe(urlInput);
    expect(screen.getByLabelText("Alt text")).toBeTruthy();
  });
});

describe("ImageUpload — Upload tab", () => {
  it("labels the alt-text field via id/htmlFor", () => {
    render(
      <ImageUpload
        onClose={vi.fn()}
        onInsertUrl={vi.fn()}
        onUploadFile={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Upload"));
    expect(screen.getByLabelText("Alt text")).toBeTruthy();
  });
});

describe("ImageUpload — Media tab", () => {
  it("labels the search field with aria-label and focuses it on mount, via a ref effect not the autoFocus attribute", () => {
    render(
      <ImageUpload
        onClose={vi.fn()}
        onInsertUrl={vi.fn()}
        mediaResults={[]}
        mediaSearchTerm=""
        onMediaSearchChange={vi.fn()}
      />,
    );
    const search = screen.getByLabelText("Search images");
    expect(search.hasAttribute("autofocus")).toBe(false);
    expect(document.activeElement).toBe(search);
  });
});

describe("ImageUpload — two pickers mounted at once", () => {
  it("gives each picker's URL/alt fields distinct ids, correctly associated with their own label", () => {
    const first = render(<ImageUpload onClose={vi.fn()} onInsertUrl={vi.fn()} />);
    const second = render(<ImageUpload onClose={vi.fn()} onInsertUrl={vi.fn()} />);

    const firstUrlInput = within(first.container).getByLabelText("Image URL");
    const secondUrlInput = within(second.container).getByLabelText("Image URL");
    expect(firstUrlInput.id).not.toBe("");
    expect(secondUrlInput.id).not.toBe("");
    expect(firstUrlInput.id).not.toBe(secondUrlInput.id);

    const firstAltInput = within(first.container).getByLabelText("Alt text");
    const secondAltInput = within(second.container).getByLabelText("Alt text");
    expect(firstAltInput.id).not.toBe(secondAltInput.id);

    first.unmount();
    second.unmount();
  });

  it("gives each picker's Upload-tab alt field a distinct id", () => {
    const first = render(
      <ImageUpload onClose={vi.fn()} onInsertUrl={vi.fn()} onUploadFile={vi.fn()} />,
    );
    const second = render(
      <ImageUpload onClose={vi.fn()} onInsertUrl={vi.fn()} onUploadFile={vi.fn()} />,
    );

    fireEvent.click(within(first.container).getByText("Upload"));
    fireEvent.click(within(second.container).getByText("Upload"));

    const firstAltInput = within(first.container).getByLabelText("Alt text");
    const secondAltInput = within(second.container).getByLabelText("Alt text");
    expect(firstAltInput.id).not.toBe("");
    expect(secondAltInput.id).not.toBe("");
    expect(firstAltInput.id).not.toBe(secondAltInput.id);

    first.unmount();
    second.unmount();
  });
});
