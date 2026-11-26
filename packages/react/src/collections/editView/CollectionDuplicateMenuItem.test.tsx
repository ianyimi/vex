import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { describe, expect, it } from "vitest";
import { defineCollection, defineConfig, text, type CollectionConfig } from "@vexcms/core";
import { VexConfigProvider } from "../../config/VexConfigContext";
import { VexAuthProvider } from "../../auth/VexAuthContext";
import { VexDocumentProvider } from "../../documents/VexDocumentContext";
import {
  EditActionsMenuDialogProvider,
  type EditActionsMenuDialogState,
} from "../../documents/EditActionsMenuDialogContext";
import { DropdownMenu, DropdownMenuContent } from "../../ui/dropdown-menu";
import { testCollection } from "../../testing/harness/accessFixtures";
import { CollectionDuplicateMenuItem } from "./CollectionDuplicateMenuItem";

/**
 * Mirrors `DocumentEditActionsMenu`'s own dialog host: a `useState` holding the current dialog
 * node, rendered OUTSIDE `DropdownMenuContent` so it survives the dropdown closing on select —
 * the stub `{ open: () => {}, close: () => {} }}` the pre-existing tests used never actually
 * renders what `dialog.open(...)` is given, so it cannot exercise the duplicate dialog itself.
 */
function DialogHost(props: { children: (dialog: EditActionsMenuDialogState) => ReactNode }) {
  const [dialogNode, setDialogNode] = useState<ReactNode>(null);
  const dialog: EditActionsMenuDialogState = {
    open: (node) => setDialogNode(node),
    close: () => setDialogNode(null),
  };
  return (
    <>
      {props.children(dialog)}
      {dialogNode}
    </>
  );
}

function renderMenuItem(
  collection: CollectionConfig,
  document?: Record<string, unknown>,
  slug: string = collection.slug,
) {
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
                slug,
                id: "doc1",
                saved: document ?? { title: "Hello" },
                isDirty: false,
                canEdit: true,
              }}
            >
              {/* `EditActionsMenuItem` renders a base-ui `Menu.Item`, which needs an
                  open `Menu.Root`/`Menu.Popup` ancestor — the same `DropdownMenu`/
                  `DropdownMenuContent` pair `DocumentEditActionsMenu` renders around
                  every `edit.actionsMenu` contribution. */}
              <DialogHost>
                {(dialog) => (
                  <DropdownMenu open>
                    <DropdownMenuContent>
                      <EditActionsMenuDialogProvider value={dialog}>
                        <CollectionDuplicateMenuItem kind="collection" slug={slug} />
                      </EditActionsMenuDialogProvider>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </DialogHost>
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

describe("CollectionDuplicateMenuItem — unresolvable slug", () => {
  it("renders nothing, and never throws, for a slug config.collections doesn't resolve", () => {
    // Before this fix, `useDuplicateCollectionDocument` required a `CollectionConfig` and the
    // caller passed `collection!` — a lie that threw inside the hook (dereferencing `undefined`)
    // before the component's own `!collection` guard ever ran.
    expect(() => renderMenuItem(testCollection, undefined, "nonexistent")).not.toThrow();
    expect(screen.queryByText("Duplicate")).not.toBeInTheDocument();
  });
});

describe("CollectionDuplicateMenuItem — duplicate dialog", () => {
  const titledCollection = defineCollection({
    slug: testCollection.slug,
    fields: { title: text({ required: true }) },
    admin: { useAsTitle: "title" },
  });

  it("opens the create-document dialog prefilled with the renamed title", async () => {
    renderMenuItem(titledCollection, { title: "Browser Test 11/22" });
    fireEvent.click(screen.getByText("Duplicate"));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByLabelText(/title/i)).toHaveValue("Browser Test 11/22 (2)");
  });

  it("shows a note naming the source document's current title", async () => {
    renderMenuItem(titledCollection, { title: "Browser Test 11/22" });
    fireEvent.click(screen.getByText("Duplicate"));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("All other fields are copied from Browser Test 11/22.");
  });

  it("falls back to a generic note when useAsTitle is a system field", async () => {
    // `testCollection` declares no `admin.useAsTitle`, which resolves to the `_id` default.
    renderMenuItem(testCollection, { title: "Hello" });
    fireEvent.click(screen.getByText("Duplicate"));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("All other fields are copied from the duplicated document.");
  });
});
