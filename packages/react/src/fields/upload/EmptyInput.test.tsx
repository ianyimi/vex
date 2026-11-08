import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { defineMediaCollection } from "@vexcms/file-storage-convex/client";
import { uploadFieldFixture } from "./testFixture";
import { UploadEmpty } from "./EmptyInput";

const targetCollectionConfig = defineMediaCollection({ slug: "images" });

describe("UploadEmpty", () => {
  it("keeps the dropzone's native file input in the tab order (opacity-0, not hidden) — real Tab reaches it with no custom keyboard handler needed", async () => {
    const user = userEvent.setup();
    render(
      <UploadEmpty
        name="cover"
        onPickerOpen={vi.fn()}
        onFilesSelected={vi.fn()}
        fieldDef={uploadFieldFixture.fieldDef}
        targetCollectionConfig={targetCollectionConfig}
      />,
    );
    await user.tab();
    const fileInput = document.getElementById("cover");
    expect(fileInput).toHaveFocus();
    expect(fileInput).toHaveAttribute("type", "file");
    expect(fileInput).not.toHaveAttribute("hidden");
    expect(fileInput).not.toHaveAttribute("disabled");
    expect(screen.getByText(/Drop files here or click to browse/)).toBeInTheDocument();
  });
});
