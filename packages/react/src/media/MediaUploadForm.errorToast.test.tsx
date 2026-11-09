import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexProvider, type ConvexReactClient } from "convex/react";
import { convexTest } from "convex-test";
import { getFunctionName } from "convex/server";
import { text } from "@vexcms/core";
import type { MediaCollectionConfig, UploadField } from "@vexcms/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import { createFakeConvexClient } from "../testing/convex/bridge";
import schema, { testModules } from "../testing/convex/schema";
import { MediaUploadForm } from "./MediaUploadForm";

// Mirrors `MediaUploadForm.test.tsx`'s own inline fixtures — only the
// fields `MediaUploadForm` itself reads.
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

/**
 * Regression coverage for the double-toast bug: `createMediaDoc` (a
 * `useVexMutation`) had no `errorToast: false`, so a rejected create fired
 * BOTH `useVexMutation`'s own default "Request failed" `onError` toast AND
 * `onSubmit`'s own catch-and-toast ("Upload failed") — two toasts for one
 * failure. Builds `createFakeConvexClient`'s real fake, then overrides only
 * `"vex/media:createMediaDocument"` to reject, so every other step
 * (`generateUploadUrl`, the raw `fetch` POST, `measureImageDimensions`)
 * still runs exactly as it would in production. `fetch` itself is stubbed
 * since `MediaUploadForm`'s upload step calls it directly rather than
 * through a storage adapter.
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

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const onComplete = vi.fn();
  const utils = render(
    <ConvexProvider client={failingClient}>
      <QueryClientProvider client={queryClient}>
        <MediaUploadForm
          fieldDef={makeMockUploadField()}
          collectionConfig={makeMockMediaCollection()}
          multi
          stagedFiles={[makeFile("cover.png")]}
          onComplete={onComplete}
          onCancel={vi.fn()}
        />
      </QueryClientProvider>
    </ConvexProvider>,
  );
  return { utils, onComplete };
}

describe("MediaUploadForm — createMediaDoc rejection shows exactly one toast", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("shows exactly one error toast when the create mutation rejects", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ storageId: "storage_1" }) }),
    );
    const toastErrorSpy = vi.spyOn(toast, "error");
    const { onComplete } = renderWithFailingCreate();

    fireEvent.click(screen.getByRole("button", { name: /Create & select/ }));

    await waitFor(() => expect(toastErrorSpy).toHaveBeenCalled());

    expect(toastErrorSpy).toHaveBeenCalledTimes(1);
    expect(toastErrorSpy).toHaveBeenCalledWith("Upload failed", expect.anything());
    expect(onComplete).not.toHaveBeenCalled();
  });
});
