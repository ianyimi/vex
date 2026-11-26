import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { defineConfig, vexConvexApi, type VersionSummary } from "@vexcms/core";
import { DocumentEditActionsMenu } from "../documents/DocumentEditActionsMenu";
import { VersionHistoryMenuItem } from "./VersionHistoryMenuItem";
import { VexConfigProvider } from "../config/VexConfigContext";
import { VexDocumentProvider, type VexDocumentState } from "../documents/VexDocumentContext";
import { DocumentEditRuntimeProvider, type DocumentEditRuntimeState } from "../documents/DocumentEditRuntimeContext";
import { testCollection } from "../testing/harness/accessFixtures";
import type * as ConvexReactQueryModule from "@convex-dev/react-query";
import type * as TanstackQueryModule from "@tanstack/react-query";

const { fetchQueryMock, deleteVersionMock } = vi.hoisted(() => ({
  fetchQueryMock: vi.fn(),
  deleteVersionMock: vi.fn(),
}));

vi.mock("@convex-dev/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof ConvexReactQueryModule>();
  return {
    ...actual,
    convexQuery: (reference: unknown, args: unknown) => ({ __reference: reference, __args: args }),
    useConvexMutation: (reference: unknown) => {
      if (reference === vexConvexApi.versions.deleteVersion) return deleteVersionMock;
      throw new Error(`VersionHistoryMenuItem test: unexpected mutation reference ${String(reference)}`);
    },
  };
});

// Fixture rows the mocked `listVersions` query serves — a draft at version 3 is the active
// pointer in most tests here, unless a test reassigns this.
let versionRows: VersionSummary[] = [];

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof TanstackQueryModule>();
  return {
    ...actual,
    useQuery: (options: { __reference?: unknown; enabled?: boolean }) =>
      options.__reference === vexConvexApi.versions.listVersions && options.enabled
        ? { data: versionRows }
        : { data: undefined },
    useMutation: ({ mutationFn }: { mutationFn: (...args: unknown[]) => unknown }) => ({
      mutateAsync: mutationFn,
      isPending: false,
    }),
    useQueryClient: () => ({ fetchQuery: fetchQueryMock }),
  };
});

const versionedCollection = {
  ...testCollection,
  versions: { ...testCollection.versions, drafts: true },
} as unknown as typeof testCollection;

const config = defineConfig({ collections: [versionedCollection] });

const threeVersions: VersionSummary[] = [
  { version: 3, status: "draft", createdBy: "user_a", createdAt: 3000, publishedAt: null },
  { version: 2, status: "published", createdBy: "user_b", createdAt: 2000, publishedAt: 2000 },
  { version: 1, status: "published", createdBy: "user_c", createdAt: 1000, publishedAt: 1000 },
];

function baseDocumentState(activeVersion: number): VexDocumentState {
  return {
    kind: "collection",
    slug: versionedCollection.slug,
    id: "doc1",
    saved: { vex_status: "draft", vex_activeVersion: activeVersion },
    isDirty: false,
    status: "draft",
    canEdit: true,
  };
}

const runtimeState: DocumentEditRuntimeState = {
  viewedVersion: null,
  onViewVersion: vi.fn(),
  onSaved: vi.fn(),
};

/**
 * Mounts `DocumentEditActionsMenu` — the real ⋯ menu — with `VersionHistoryMenuItem` as its
 * only builtin, inside every context the real edit views provide. `setDocumentState` mutates the
 * `VexDocumentProvider` value WITHOUT unmounting the dialog, reproducing the real scenario: a
 * live `vex_activeVersion` change landing while the History dialog stays open.
 */
function renderMenu(initialActiveVersion: number) {
  function Harness({ activeVersion }: { activeVersion: number }) {
    return (
      <VexConfigProvider config={config}>
        <VexDocumentProvider value={baseDocumentState(activeVersion)}>
          <DocumentEditRuntimeProvider value={runtimeState}>
            <DocumentEditActionsMenu
              root={undefined}
              resource={undefined}
              builtins={[{ id: "vex.versionHistory", component: VersionHistoryMenuItem }]}
              contributedProps={{ kind: "collection", slug: versionedCollection.slug }}
            />
          </DocumentEditRuntimeProvider>
        </VexDocumentProvider>
      </VexConfigProvider>
    );
  }

  const view = render(<Harness activeVersion={initialActiveVersion} />);
  return {
    setActiveVersion: (activeVersion: number) => {
      act(() => {
        view.rerender(<Harness activeVersion={activeVersion} />);
      });
    },
  };
}

/** Clicks the ⋯ trigger, then History, and waits for the dialog to mount. */
async function openHistoryDialog() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "More actions" }));
  await screen.findByRole("menuitem", { name: "History" });
  await user.click(screen.getByRole("menuitem", { name: "History" }));
  await screen.findByRole("dialog");
  return user;
}

describe("VersionHistoryMenuItem", () => {
  beforeEach(() => {
    versionRows = threeVersions;
  });

  it("moves the shown (green) row when vex_activeVersion changes while the dialog stays open", async () => {
    const { setActiveVersion } = renderMenu(1);
    await openHistoryDialog();

    // Pointer starts at version 1 — its row is the shown/green one.
    expect(screen.getByText("Version 1")).toHaveClass("text-green-600");
    expect(screen.getByText("Version 3")).not.toHaveClass("text-green-600");

    // The live document's `vex_activeVersion` advances (another publish) WITHOUT the dialog
    // closing — before the fix, `openHistory()` froze `activeVersion` into the dialog element's
    // props at click time, so this never moved the green row.
    setActiveVersion(3);

    expect(screen.getByText("Version 3")).toHaveClass("text-green-600");
    expect(screen.getByText("Version 1")).not.toHaveClass("text-green-600");
  });
});
