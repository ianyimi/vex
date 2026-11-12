import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexProvider, type ConvexReactClient } from "convex/react";
import { convexTest } from "convex-test";
import { describe, expect, it, vi } from "vitest";
import { ConvexError } from "convex/values";
import { VexAccessError } from "@vexcms/core";
import type {
  CollectionConfig,
  CollectionFieldMeta,
  RelationshipField,
  VexResourceSlug,
} from "@vexcms/core";

import { createFakeConvexClient } from "../../testing/convex/bridge";
import schema, { testModules } from "../../testing/convex/schema";
import {
  relationshipFieldFixture,
  relationshipTargetCollection,
} from "./testFixture";
import { RelationshipFilledState } from "./FilledInput";
import { DndProvider } from "../../ui/dnd";
import * as clientModule from "../../client";

// Mocked around the real module (not replaced wholesale) so every OTHER test in
// this file that lets `RelationshipItemRow` call the real `get()` (-> convexQuery
// over the fake convex client) keeps working unchanged. Only the two access-error
// tests below override `get`'s return value per-call via `mockReturnValueOnce`.
vi.mock("../../client", async (importOriginal) => {
  const actual = await importOriginal<typeof clientModule>();
  return { ...actual, get: vi.fn(actual.get) };
});
const targetCollection = relationshipTargetCollection as CollectionConfig;

async function renderFilled(
  overrides: {
    fieldDef?: RelationshipField<VexResourceSlug, CollectionFieldMeta>;
    docIds?: string[];
    readOnly?: boolean;
    onReorder?: (from: number, to: number) => void;
  } = {},
) {
  const t = convexTest(schema, testModules);
  const seededIds: string[] = [];
  await t.run(async (ctx) => {
    for (const title of ["Alpha", "Bravo"]) {
      seededIds.push(await ctx.db.insert("documents", { title }));
    }
  });

  const convexClient = createFakeConvexClient(t) as ConvexReactClient;
  const convexQueryClient = new ConvexQueryClient(convexClient);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { queryFn: convexQueryClient.queryFn(), retry: false },
    },
  });
  convexQueryClient.connect(queryClient);

  const onRemove = vi.fn();
  const onClear = vi.fn();
  const openPicker = vi.fn();

  const utils = render(
    <ConvexProvider client={convexClient}>
      <QueryClientProvider client={queryClient}>
        <DndProvider>
          <RelationshipFilledState
            fieldDef={overrides.fieldDef ?? relationshipFieldFixture.fieldDef}
            targetCollection={targetCollection}
            docIds={overrides.docIds ?? seededIds}
            drafts={false}
            readOnly={overrides.readOnly ?? false}
            onRemove={onRemove}
            onReorder={overrides.onReorder}
            onClear={onClear}
            openPicker={openPicker}
          />
        </DndProvider>
      </QueryClientProvider>
    </ConvexProvider>,
  );

  return { ...utils, seededIds, onRemove, onClear, openPicker };
}

describe("RelationshipFilledState", () => {
  it("shows a skeleton before each row's document resolves, then its preview", async () => {
    await renderFilled();
    expect(
      document.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThan(0);
    expect(await screen.findByText("Alpha")).toBeInTheDocument();
    expect(await screen.findByText("Bravo")).toBeInTheDocument();
  });

  it("shows the n/max counter and disables Select once at max", async () => {
    const fieldDef = {
      ...relationshipFieldFixture.fieldDef,
      max: [2, "Too many"] as const,
    };
    await renderFilled({ fieldDef });
    expect(await screen.findByText("2/2")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /select documents/i }),
    ).toBeDisabled();
  });

  it("calls onRemove with the row's document id", async () => {
    const user = userEvent.setup();
    const { onRemove, seededIds } = await renderFilled();
    await screen.findByText("Alpha");

    await user.click(screen.getAllByTitle("Remove")[0]!);
    expect(onRemove).toHaveBeenCalledWith(seededIds[0]);
  });

  it("calls onClear when Clear is clicked", async () => {
    const user = userEvent.setup();
    const { onClear } = await renderFilled();
    await screen.findByText("Alpha");

    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("renders a drag handle per row when hasMany and onReorder are both provided", async () => {
    const { container } = await renderFilled({ onReorder: vi.fn() });
    await screen.findByText("Alpha");
    expect(container.querySelectorAll(".cursor-grab").length).toBe(2);
  });

  it("renders no interactive drag handle when onReorder is omitted", async () => {
    const { container } = await renderFilled({ onReorder: undefined });
    await screen.findByText("Alpha");
    expect(container.querySelectorAll(".cursor-grab").length).toBe(0);
  });

  it("names each row's drag handle after its resolved document title (F-094)", async () => {
    await renderFilled({ onReorder: vi.fn() });
    await screen.findByText("Alpha");
    await screen.findByText("Bravo");
    expect(screen.getByLabelText("Reorder Alpha")).toBeInTheDocument();
    expect(screen.getByLabelText("Reorder Bravo")).toBeInTheDocument();
  });

  it("shows the locked 'Hidden' row (no raw message) for a VexAccessError, with the denied permission in its tooltip trigger", async () => {
    const actualClient = await vi.importActual<typeof clientModule>("../../client");
    vi.mocked(clientModule.get).mockReturnValue({
      queryKey: ["relationship-access-denied-test"],
      queryFn: () =>
        Promise.reject(
          new VexAccessError({ resource: "user", action: "read", message: "You cannot read this" }),
        ),
    } as never);
    try {
      await renderFilled({ docIds: ["fake-id"] });
      expect(await screen.findByText(`Hidden ${targetCollection.labels.singular}`)).toBeInTheDocument();
      expect(screen.queryByText("You cannot read this")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Requires user/read" })).toBeInTheDocument();
    } finally {
      vi.mocked(clientModule.get).mockImplementation(actualClient.get as never);
    }
  });

  it("keeps showing a non-access error's raw message", async () => {
    const actualClient = await vi.importActual<typeof clientModule>("../../client");
    vi.mocked(clientModule.get).mockReturnValue({
      queryKey: ["relationship-generic-error-test"],
      queryFn: () => Promise.reject(new ConvexError({ code: "NOT_FOUND", message: "Document not found" })),
    } as never);
    try {
      await renderFilled({ docIds: ["fake-id"] });
      expect(await screen.findByText("Document not found")).toBeInTheDocument();
    } finally {
      vi.mocked(clientModule.get).mockImplementation(actualClient.get as never);
    }
  });
});
