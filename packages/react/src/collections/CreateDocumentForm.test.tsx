import "@testing-library/jest-dom/vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexProvider, type ConvexReactClient } from "convex/react";
import { convexTest } from "convex-test";
import { describe, expect, it, vi } from "vitest";
import { defineCollection, defineConfig, text } from "@vexcms/core";

import {
  renderWithVexProviders,
  testCollection,
} from "../testing/harness/accessFixtures";
import {
  createFakeConvexClient,
  type ConvexTestInstance,
} from "../testing/convex/bridge";
import schema, { readTable, testModules } from "../testing/convex/schema";
import { CreateDocumentForm } from "./CreateDocumentForm";

/**
 * Same shape as `modalSuite.tsx`'s `createModalTestCollection`: `status` is
 * required so there is a control to type into and submit through — a quick
 * create renders only required fields.
 */
const createFormTestCollection = defineCollection({
  slug: testCollection.slug,
  fields: {
    status: text({ index: "by_status", required: true }),
    title: text({ required: false }),
  },
});

function buildConvexStack(t: ConvexTestInstance): {
  queryClient: QueryClient;
  convexClient: ConvexReactClient;
} {
  const convexClient = createFakeConvexClient(t) as ConvexReactClient;
  const convexQueryClient = new ConvexQueryClient(convexClient);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { queryFn: convexQueryClient.queryFn(), retry: false },
    },
  });
  convexQueryClient.connect(queryClient);
  return { queryClient, convexClient };
}

function renderForm(
  overrides: {
    onCreated?: (id: string) => void;
    onCancel?: () => void;
    onSubmittingChange?: (isSubmitting: boolean) => void;
  } = {},
) {
  const t = convexTest(schema, testModules);
  const { queryClient, convexClient } = buildConvexStack(t);
  const onCreated = overrides.onCreated ?? vi.fn();
  const onCancel = overrides.onCancel ?? vi.fn();
  const utils = renderWithVexProviders(
    <ConvexProvider client={convexClient}>
      <QueryClientProvider client={queryClient}>
        <CreateDocumentForm
          collection={createFormTestCollection}
          onCreated={onCreated}
          onCancel={onCancel}
          onSubmittingChange={overrides.onSubmittingChange}
        />
      </QueryClientProvider>
    </ConvexProvider>,
    { config: defineConfig({ collections: [createFormTestCollection] }) },
  );
  return { ...utils, t, onCreated, onCancel };
}

function createdDocuments(t: ConvexTestInstance) {
  return readTable(t as never, "documents");
}

describe("CreateDocumentForm", () => {
  it("renders a control for the required field only", () => {
    renderForm();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^title/i)).not.toBeInTheDocument();
  });

  it("creates the document and calls onCreated with the new id", async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();
    const { t } = renderForm({ onCreated });

    await user.type(screen.getByLabelText(/status/i), "draft");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
    const docs = await createdDocuments(t);
    expect(docs).toHaveLength(1);
    expect(docs[0]?.status).toBe("draft");
    expect(onCreated).toHaveBeenCalledWith(docs[0]?._id);
  });

  it("calls onCancel when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    renderForm({ onCancel });

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("reports isSubmitting true around the create mutation, then false once it resolves", async () => {
    const user = userEvent.setup();
    const onSubmittingChange = vi.fn();
    renderForm({ onSubmittingChange });

    await user.type(screen.getByLabelText(/status/i), "draft");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() =>
      expect(onSubmittingChange).toHaveBeenLastCalledWith(false),
    );
    expect(onSubmittingChange).toHaveBeenCalledWith(true);
    expect(onSubmittingChange.mock.calls.map((call) => call[0])).toEqual([
      true,
      false,
    ]);
  });

  it("ignores a second rapid submit while the first is still in flight", async () => {
    const onCreated = vi.fn();
    const { t } = renderForm({ onCreated });

    await userEvent.type(screen.getByLabelText(/status/i), "draft");
    const form = screen
      .getByRole("button", { name: "Create" })
      .closest("form")!;
    fireEvent.submit(form);
    fireEvent.submit(form);

    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
    const docs = await createdDocuments(t);
    expect(docs).toHaveLength(1);
  });
});
