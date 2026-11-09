import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexProvider, type ConvexReactClient } from "convex/react";
import { convexTest } from "convex-test";
import { defineCollection, defineConfig, text } from "@vexcms/core";
import { ListViewCreateDocumentModal } from "./ListViewCreateDocumentModal";
import { renderWithVexProviders } from "../../../testing/harness/accessFixtures";
import { createFakeConvexClient } from "../../../testing/convex/bridge";
import schema, { testModules } from "../../../testing/convex/schema";

const disableCreateCollection = defineCollection({
  slug: "user",
  fields: { name: text({ required: false }) },
  // Mirrors `@vexcms/better-auth`'s adapter setting this on the auth user
  // collection (decision D2).
  disableCreate: true,
});

/**
 * Regression coverage for `collection.disableCreate` blocking
 * `?createNew=true` outright — a hand-typed URL param must not be able to
 * bypass `ListViewCreateAction` hiding the "+ New" affordance.
 */
describe("ListViewCreateDocumentModal — disableCreate", () => {
  it("renders nothing for a disableCreate collection even with ?createNew=true in the URL", () => {
    const { container } = renderWithVexProviders(
      <NuqsTestingAdapter searchParams="?createNew=true">
        <ListViewCreateDocumentModal collection={disableCreateCollection.slug} />
      </NuqsTestingAdapter>,
      { config: defineConfig({ collections: [disableCreateCollection] }) },
    );
    expect(screen.queryByText(/Create/)).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the create dialog for an ordinary collection with ?createNew=true", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
    });
    const t = convexTest(schema, testModules);
    const convexClient = createFakeConvexClient(t) as ConvexReactClient;
    const convexQueryClient = new ConvexQueryClient(convexClient);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { queryFn: convexQueryClient.queryFn(), retry: false } },
    });
    convexQueryClient.connect(queryClient);
    renderWithVexProviders(
      <ConvexProvider client={convexClient}>
        <QueryClientProvider client={queryClient}>
          <NuqsTestingAdapter searchParams="?createNew=true">
            <ListViewCreateDocumentModal collection={collection.slug} />
          </NuqsTestingAdapter>
        </QueryClientProvider>
      </ConvexProvider>,
      { config: defineConfig({ collections: [collection] }) },
    );
    expect(screen.getByText(`Create ${collection.labels.singular}`)).toBeInTheDocument();
  });
});
