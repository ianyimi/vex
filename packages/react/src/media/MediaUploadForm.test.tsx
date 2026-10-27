import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { text } from "@vexcms/core";
import type { MediaCollectionConfig, UploadField } from "@vexcms/core";
import { describe, expect, it } from "vitest";
import type { ReactNode } from "react";

import { MediaUploadForm } from "./MediaUploadForm";

// Minimal inline mock — mirrors the pattern in
// `packages/core/src/config/config.test.ts`. Only the fields MediaUploadForm
// itself reads (slug, fields.alt, labels.plural, meta.storageAdapter).
function makeMockMediaCollection(): MediaCollectionConfig {
  return {
    slug: "images",
    fields: {
      alt: text({ required: true }),
      filename: text({ required: true }),
    },
    labels: { singular: "Image", plural: "Images" },
    admin: { useAsTitle: "_id", components: {} },
    meta: { storageAdapter: "convex" },
  } as unknown as MediaCollectionConfig;
}

function makeMockUploadField(): UploadField {
  return {
    type: "upload",
    to: "images",
    hasMany: true,
    min: 0,
    accept: "image/*",
    admin: {},
  } as unknown as UploadField;
}

function makeFile(name: string) {
  return new File(["content"], name, { type: "image/png" });
}

function Wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient();
  const convexClient = new ConvexReactClient("https://example.convex.cloud");
  return (
    <ConvexProvider client={convexClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ConvexProvider>
  );
}

describe("MediaUploadForm", () => {
  it("renders the staged-files accordion without an invalid hook call", () => {
    // The accordion's open-state hooks live inside the `form.Field`
    // render-prop callback (unconditionally, before the empty-state early
    // return) rather than at MediaUploadForm's own top level — a plain
    // "Invalid hook call" runtime error, not just a lint warning, would
    // throw synchronously here if that were unsafe.
    expect(() =>
      render(
        <Wrapper>
          <MediaUploadForm
            collectionConfig={makeMockMediaCollection()}
            fieldDef={makeMockUploadField()}
            multi={true}
            stagedFiles={[makeFile("first.png")]}
            onComplete={() => {}}
            onCancel={() => {}}
          />
        </Wrapper>,
      ),
    ).not.toThrow();

    expect(screen.getByText("first.png")).toBeTruthy();
  });

  it("does not throw when files are appended after the accordion has already mounted", () => {
    render(
      <Wrapper>
        <MediaUploadForm
          collectionConfig={makeMockMediaCollection()}
          fieldDef={makeMockUploadField()}
          multi={true}
          stagedFiles={[makeFile("first.png")]}
          onComplete={() => {}}
          onCancel={() => {}}
        />
      </Wrapper>,
    );

    // "Add more" appends to the already-mounted accordion — the exact
    // uncontrolled-`defaultValue`-changes-after-init scenario Base UI warns
    // about, and previously an invalid-hook-call risk if state lived at the
    // wrong scope.
    const fileInput = document.querySelector('input[type="file"]:not([multiple="false"])');
    expect(fileInput).not.toBeNull();

    expect(() =>
      fireEvent.change(fileInput as HTMLInputElement, {
        target: { files: [makeFile("second.png")] },
      }),
    ).not.toThrow();

    expect(screen.getByText("first.png")).toBeTruthy();
    expect(screen.getByText("second.png")).toBeTruthy();
  });
});
