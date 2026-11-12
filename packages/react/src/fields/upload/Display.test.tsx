import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { defineConfig, type TDocument } from "@vexcms/core";
import { defineMediaCollection } from "@vexcms/file-storage-convex/client";
import { UploadFieldDisplay } from "./Display";
import { uploadFieldFixture } from "./testFixture";
import { testCollection } from "../../testing/harness/accessFixtures";
import { VexConfigProvider } from "../../config/VexConfigContext";

const document: TDocument = { _id: "doc_1", _creationTime: 0 };
const imagesMediaCollection = defineMediaCollection({ slug: "images" });
const config = defineConfig({ collections: [testCollection], mediaCollections: [imagesMediaCollection] });

describe("UploadFieldDisplay", () => {
  it("renders one chip per populated media doc, with the filename and a thumbnail", () => {
    render(
      <VexConfigProvider config={config}>
        <UploadFieldDisplay
          field={uploadFieldFixture.fieldDef}
          value={
            [
              {
                _id: "images_1",
                _creationTime: 0,
                filename: "cover.png",
                mimeType: "image/png",
                size: 1024,
                alt: "",
                storageId: "storage_1",
                deleted: false,
                src: "https://example.com/cover.png",
              },
            ] as never
          }
          document={document}
          collection={testCollection}
        />
      </VexConfigProvider>,
    );
    expect(screen.getByText("cover.png")).toBeInTheDocument();
  });

  it("renders the raw id as the chip title for an unpopulated value", () => {
    render(
      <VexConfigProvider config={config}>
        <UploadFieldDisplay
          field={uploadFieldFixture.fieldDef}
          value={["images_2"]}
          document={document}
          collection={testCollection}
        />
      </VexConfigProvider>,
    );
    const chip = screen.getByText("images_2");
    expect(chip).toHaveAttribute("title", "images_2");
  });

  it("shows an em-dash for an empty upload field", () => {
    render(
      <VexConfigProvider config={config}>
        <UploadFieldDisplay
          field={uploadFieldFixture.fieldDef}
          value={[]}
          document={document}
          collection={testCollection}
        />
      </VexConfigProvider>,
    );
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders AccessDeniedChip's lock badge for a HiddenDocument placeholder (populateDocs denied target) instead of crashing FilePreview", () => {
    render(
      <VexConfigProvider config={config}>
        <UploadFieldDisplay
          field={uploadFieldFixture.fieldDef}
          value={[{ _id: "images_3", code: "ACCESS_DENIED", resource: "images", action: "read" }] as never}
          document={document}
          collection={testCollection}
        />
      </VexConfigProvider>,
    );
    expect(
      screen.getByText(`Hidden ${imagesMediaCollection.labels.singular}`),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Requires images/read" })).toBeInTheDocument();
  });
});
