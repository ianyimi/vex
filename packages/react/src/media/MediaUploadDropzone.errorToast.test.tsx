import "@testing-library/jest-dom/vitest";
import { fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexProvider, type ConvexReactClient } from "convex/react";
import { convexTest } from "convex-test";
import { getFunctionName } from "convex/server";
import { defineConfig } from "@vexcms/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import { renderWithVexProviders, testCollection } from "../testing/harness/accessFixtures";
import { createFakeConvexClient } from "../testing/convex/bridge";
import schema, { testModules } from "../testing/convex/schema";
import { makeFile } from "../fields/upload/testFixture";
import { MediaUploadDropzone } from "./MediaUploadDropzone";

/**
 * Regression coverage for the double-toast bug: `createMediaDocument` (a
 * `useVexMutation`) had no `errorToast: false`, so a rejected create fired
 * BOTH `useVexMutation`'s own default "Request failed" `onError` toast AND
 * `onDrop`'s own catch-and-toast ("Upload failed") — two toasts for one
 * failure. Builds `createFakeConvexClient`'s real fake, then overrides only
 * `"vex/media:createMediaDocument"` to reject, so every other step
 * (`generateUploadUrl`, the adapter's `uploadFile`, `measureImageDimensions`)
 * still runs exactly as it would in production.
 */
function renderWithFailingCreate() {
  const t = convexTest(schema, testModules);
  const realClient = createFakeConvexClient(t) as ConvexReactClient;
  const failingClient = {
    ...realClient,
    mutation: async (func: Parameters<ConvexReactClient["mutation"]>[0], args?: unknown) => {
      const name = typeof func === "string" ? func : getFunctionName(func);
      if (name === "vex/media:createMediaDocument") {
        throw new Error("create rejected");
      }
      return realClient.mutation(func as never, args as never);
    },
  } as unknown as ConvexReactClient;

  const convexQueryClient = new ConvexQueryClient(failingClient);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { queryFn: convexQueryClient.queryFn(), retry: false } },
  });
  convexQueryClient.connect(queryClient);

  const uploadFile = vi.fn(async () => ({ storageId: "storage_1" }));
  const onUploadComplete = vi.fn();
  const utils = renderWithVexProviders(
    <ConvexProvider client={failingClient}>
      <QueryClientProvider client={queryClient}>
        <MediaUploadDropzone
          targetCollection="images"
          adapterName="convex"
          onUploadComplete={onUploadComplete}
        />
      </QueryClientProvider>
    </ConvexProvider>,
    {
      config: defineConfig({
        collections: [testCollection],
        storage: { clientUploads: { convex: uploadFile } },
      }),
    },
  );
  return { utils, onUploadComplete };
}

describe("MediaUploadDropzone — createMediaDocument rejection shows exactly one toast", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows exactly one error toast when the create mutation rejects", async () => {
    const toastErrorSpy = vi.spyOn(toast, "error");
    const { utils, onUploadComplete } = renderWithFailingCreate();
    const root = utils.container.querySelector('[role="presentation"]') as HTMLElement;
    const file = makeFile("cover.png", "image/png");

    fireEvent.drop(root, { dataTransfer: { files: [file], types: ["Files"] } });

    await waitFor(() => expect(toastErrorSpy).toHaveBeenCalled());

    expect(toastErrorSpy).toHaveBeenCalledTimes(1);
    expect(toastErrorSpy).toHaveBeenCalledWith("Upload failed", expect.anything());
    expect(onUploadComplete).not.toHaveBeenCalled();
  });
});
