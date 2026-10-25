import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { defineConfig } from "@vexcms/core";
import type { MediaCollectionConfig, VexClientConfig } from "@vexcms/core";
import { describe, expect, it } from "vitest";
import type { TypedFieldApi } from "../form";

import { uploadFieldFixture } from "../fields/upload/testFixture";
import { VexConfigContext } from "../../context";
import { MediaPicker } from "./MediaPicker";

function makeMockMediaCollection(): MediaCollectionConfig {
  return {
    slug: "images",
    fields: {},
    labels: { singular: "Image", plural: "Images" },
    admin: { useAsTitle: "_id", components: {} },
    meta: { storageAdapter: "convex" },
  } as unknown as MediaCollectionConfig;
}

const stubClientConfig: VexClientConfig = defineConfig({
  mediaCollections: [makeMockMediaCollection()],
  storage: {
    clientUploads: { convex: async () => ({ storageId: "stub-id" }) },
  },
});

function Harness({ defaultTab }: { defaultTab?: "library" | "upload" }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { queryFn: () => new Promise<never>(() => {}) },
    },
  });
  const convexClient = new ConvexReactClient("https://example.convex.cloud");
  const field = { state: { value: [] } } as unknown as TypedFieldApi<string[]>;
  return (
    <ConvexProvider client={convexClient}>
      <QueryClientProvider client={queryClient}>
        <VexConfigContext.Provider value={stubClientConfig}>
          <MediaPicker
            field={field}
            fieldDef={uploadFieldFixture.fieldDef}
            targetCollection="images"
            multi={uploadFieldFixture.fieldDef.hasMany}
            defaultTab={defaultTab}
            onSelect={() => {}}
            onCancel={() => {}}
          />
        </VexConfigContext.Provider>
      </QueryClientProvider>
    </ConvexProvider>
  );
}

describe("MediaPicker", () => {
  it("returns to the Library tab when Upload's own Cancel is clicked, instead of doing nothing", async () => {
    render(<Harness defaultTab="upload" />);
    expect(
      screen.getByText("Drop Files here, or click to choose"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() =>
      expect(
        screen.queryByText("Drop Files here, or click to choose"),
      ).not.toBeInTheDocument(),
    );
    expect(
      screen.getByPlaceholderText("Search Images by filename or alt…"),
    ).toBeInTheDocument();
  });

  it("shows pluralized selection copy in the Library footer instead of the dead duplicate-branch ternary", () => {
    render(<Harness />);
    expect(screen.getByText("0 items selected")).toBeInTheDocument();
  });

  it("passes the upload field's accept patterns to the grid's Type filter instead of letting it fall back to the generic categories", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Type" }));
    await screen.findByRole("menu");

    expect(
      screen.getByRole("menuitemradio", { name: "Images" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitemradio", { name: "PDF" }),
    ).not.toBeInTheDocument();
  });
});
