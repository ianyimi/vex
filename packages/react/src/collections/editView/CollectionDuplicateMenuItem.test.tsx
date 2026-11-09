import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { describe, expect, it } from "vitest";
import { defineConfig, type CollectionConfig } from "@vexcms/core";
import { VexConfigProvider } from "../../config/VexConfigContext";
import { VexAuthProvider } from "../../auth/VexAuthContext";
import { VexDocumentProvider } from "../../documents/VexDocumentContext";
import { EditActionsMenuDialogProvider } from "../../documents/EditActionsMenuDialogContext";
import { DropdownMenu, DropdownMenuContent } from "../../ui/dropdown-menu";
import { testCollection } from "../../testing/harness/accessFixtures";
import { CollectionDuplicateMenuItem } from "./CollectionDuplicateMenuItem";

function renderMenuItem(collection: CollectionConfig) {
  const config = defineConfig({ collections: [collection] });
  const convexClient = new ConvexReactClient("https://example.convex.cloud");
  const queryClient = new QueryClient();
  return render(
    <ConvexProvider client={convexClient}>
      <QueryClientProvider client={queryClient}>
        <VexConfigProvider config={config}>
          <VexAuthProvider value={{ user: null }}>
            <VexDocumentProvider
              value={{
                kind: "collection",
                slug: collection.slug,
                id: "doc1",
                saved: { title: "Hello" },
                isDirty: false,
                canEdit: true,
              }}
            >
              {/* `EditActionsMenuItem` renders a base-ui `Menu.Item`, which needs an
                  open `Menu.Root`/`Menu.Popup` ancestor — the same `DropdownMenu`/
                  `DropdownMenuContent` pair `DocumentEditActionsMenu` renders around
                  every `edit.actionsMenu` contribution. */}
              <DropdownMenu open>
                <DropdownMenuContent>
                  <EditActionsMenuDialogProvider value={{ open: () => {}, close: () => {} }}>
                    <CollectionDuplicateMenuItem kind="collection" slug={collection.slug} />
                  </EditActionsMenuDialogProvider>
                </DropdownMenuContent>
              </DropdownMenu>
            </VexDocumentProvider>
          </VexAuthProvider>
        </VexConfigProvider>
      </QueryClientProvider>
    </ConvexProvider>,
  );
}

/**
 * Regression coverage for the `disableCreate` gap in `CollectionDuplicateMenuItem`:
 * before this fix, "Duplicate" offered a working admin-authored create for a collection whose
 * `disableCreate` says it has none (e.g. the auth user collection, decision D2), via the
 * all-fields fallback dialog's own `ListViewCreateDocumentForm`.
 */
describe("CollectionDuplicateMenuItem — disableCreate", () => {
  it("renders nothing for a disableCreate collection", () => {
    const disableCreateCollection: CollectionConfig = {
      ...testCollection,
      disableCreate: true,
    };
    renderMenuItem(disableCreateCollection);
    expect(screen.queryByText("Duplicate")).not.toBeInTheDocument();
  });

  it("renders the Duplicate item for a normal (non-disableCreate) collection", () => {
    renderMenuItem(testCollection);
    expect(screen.getByText("Duplicate")).toBeInTheDocument();
  });
});
