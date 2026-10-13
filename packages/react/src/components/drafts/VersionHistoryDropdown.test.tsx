import { render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { DRAFT_ACTIONS, vexConvexApi, type VersionSummary } from "@vexcms/core";
import { VersionHistoryDropdown, type VersionHistoryTarget } from "./VersionHistoryDropdown";
import type * as HooksModule from "../../hooks";
import type * as ConvexReactQueryModule from "@convex-dev/react-query";
import type * as TanstackQueryModule from "@tanstack/react-query";

const { usePermissionMock, fetchQueryMock, deleteVersionMock } = vi.hoisted(() => ({
  usePermissionMock: vi.fn(),
  fetchQueryMock: vi.fn(),
  deleteVersionMock: vi.fn(),
}));

vi.mock("../../hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof HooksModule>();
  return { ...actual, usePermission: usePermissionMock };
});

vi.mock("@convex-dev/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof ConvexReactQueryModule>();
  return {
    ...actual,
    convexQuery: (reference: unknown, args: unknown) => ({
      __reference: reference,
      __args: args,
    }),
    // Any write other than deleteVersion throws — viewing must never save.
    useConvexMutation: (reference: unknown) => {
      if (reference === vexConvexApi.versions.deleteVersion) return deleteVersionMock;
      throw new Error(
        `VersionHistoryDropdown test: unexpected mutation reference ${String(reference)}`,
      );
    },
  };
});

// Newest-first fixture rows the mocked `listVersions` query serves; each test sets this
// before rendering.
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

/** Sets `usePermission`'s return per `DRAFT_ACTIONS`, defaulting every action to `granted`. */
function mockPermissions(overrides: Partial<Record<string, boolean>> = {}, granted = true) {
  const table: Record<string, boolean> = {
    [DRAFT_ACTIONS.readDrafts]: granted,
    [DRAFT_ACTIONS.deleteVersions]: granted,
    ...overrides,
  };
  usePermissionMock.mockImplementation(({ action }: { action: string }) => table[action] ?? false);
}

/**
 * Clicks the History trigger and waits for the menu to mount. Base UI opens a
 * menu on `mousedown`, deferred one animation frame (so focus settles without
 * `:focus-visible`), and ignores the click that follows — so the menu is not
 * in the DOM yet when `user.click` resolves.
 */
async function openHistory() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "History" }));
  await screen.findByRole("menu");
  return user;
}

function renderDropdown(props: {
  target?: VersionHistoryTarget;
  hasDraft?: boolean;
  hasUnsavedChanges?: boolean;
  viewingVersion?: number | null;
  onViewVersion?: () => void;
} = {}) {
  render(
    <VersionHistoryDropdown
      target={props.target ?? { collection: "posts", documentId: "doc1" }}
      hasDraft={props.hasDraft ?? true}
      hasUnsavedChanges={props.hasUnsavedChanges ?? false}
      viewingVersion={props.viewingVersion ?? null}
      onViewVersion={props.onViewVersion ?? vi.fn()}
    />,
  );
}

const threeVersions: VersionSummary[] = [
  { version: 3, status: "draft", createdBy: "user_a", createdAt: 3000, publishedAt: null },
  { version: 2, status: "published", createdBy: "user_b", createdAt: 2000, publishedAt: 2000 },
  { version: 1, status: "published", createdBy: "user_c", createdAt: 1000, publishedAt: 1000 },
];

describe("VersionHistoryDropdown", () => {
  beforeEach(() => {
    usePermissionMock.mockReset();
    fetchQueryMock.mockReset();
    deleteVersionMock.mockReset();
    versionRows = [];
    mockPermissions();
  });

  it("renders nothing without readDrafts", () => {
    mockPermissions({}, false);

    renderDropdown();

    expect(screen.queryByText("History")).toBeNull();
  });

  it("lists versions newest-first with version number, status badge, creator and timestamp", async () => {
    versionRows = threeVersions;

    renderDropdown();
    await openHistory();

    const versionLabels = screen.getAllByText(/^Version \d$/).map((el) => el.textContent);
    expect(versionLabels).toEqual(["Version 3", "Version 2", "Version 1"]);
    expect(screen.getAllByText("Draft")).toHaveLength(1);
    expect(screen.getAllByText("Published")).toHaveLength(2);
    expect(screen.getByText("user_a")).toBeInTheDocument();
    expect(screen.getByText("user_b")).toBeInTheDocument();
    expect(screen.getByText("user_c")).toBeInTheDocument();
    expect(screen.getByText(new Date(3000).toLocaleString())).toBeInTheDocument();
  });

  it("highlights the newest version while a draft exists and never offers to delete it or the published version", async () => {
    versionRows = threeVersions;

    renderDropdown();
    await openHistory();

    expect(screen.getByText("Version 3").className).toContain("text-green-600");
    expect(screen.getByText("Version 2").className).not.toContain("text-green-600");
    expect(
      screen.getAllByRole("button", { name: /^View version/ }).map((b) => b.getAttribute("aria-label")),
    ).toEqual(["View version 2", "View version 1"]);
    expect(
      screen.getAllByRole("button", { name: /^Delete version/ }).map((b) => b.getAttribute("aria-label")),
    ).toEqual(["Delete version 1"]);
  });

  it("without a draft, highlights the most recently published version as live and never offers to delete it", async () => {
    versionRows = [
      { version: 3, status: "draft", createdBy: "user_a", createdAt: 3000, publishedAt: null },
      { version: 2, status: "published", createdBy: "user_b", createdAt: 2000, publishedAt: 9000 },
      { version: 1, status: "published", createdBy: "user_c", createdAt: 1000, publishedAt: 1000 },
    ];

    renderDropdown({ hasDraft: false });
    await openHistory();

    expect(screen.getByText("Version 2").className).toContain("text-green-600");
    expect(screen.getByText("Version 3").className).not.toContain("text-green-600");
    expect(
      screen.getAllByRole("button", { name: /^Delete version/ }).map((b) => b.getAttribute("aria-label")),
    ).toEqual(["Delete version 3", "Delete version 1"]);
  });

  it("while viewing an older version, highlights it and lets the newest be viewed but never deleted", async () => {
    versionRows = threeVersions;

    renderDropdown({ viewingVersion: 2 });
    await openHistory();

    expect(screen.getByText("Version 2").className).toContain("text-green-600");
    expect(screen.getByText("Version 3").className).not.toContain("text-green-600");
    expect(
      screen.getAllByRole("button", { name: /^View version/ }).map((b) => b.getAttribute("aria-label")),
    ).toEqual(["View version 3", "View version 1"]);
    expect(
      screen.getAllByRole("button", { name: /^Delete version/ }).map((b) => b.getAttribute("aria-label")),
    ).toEqual(["Delete version 1"]);
  });

  it("viewing an older version hands its snapshot to the edit view without saving", async () => {
    versionRows = threeVersions;
    fetchQueryMock.mockResolvedValue({ snapshot: { title: "Old title" }, status: "published" });
    const onViewVersion = vi.fn();

    renderDropdown({ onViewVersion });
    const user = await openHistory();
    await user.click(screen.getByRole("button", { name: "View version 1" }));

    await waitFor(() =>
      expect(onViewVersion).toHaveBeenCalledWith({ version: 1, snapshot: { title: "Old title" } }),
    );
  });

  it("viewing the newest version returns to the live document without fetching a snapshot", async () => {
    versionRows = threeVersions;
    const onViewVersion = vi.fn();

    renderDropdown({ viewingVersion: 1, onViewVersion });
    const user = await openHistory();
    await user.click(screen.getByRole("button", { name: "View version 3" }));

    expect(onViewVersion).toHaveBeenCalledWith(null);
    expect(fetchQueryMock).not.toHaveBeenCalled();
  });

  it('resolves permissions against a global\'s own slug — never "vex_globals"', async () => {
    versionRows = threeVersions;

    renderDropdown({ target: { global: "announcement" } });
    await openHistory();

    for (const call of usePermissionMock.mock.calls) {
      expect(call[0].resource).toBe("announcement");
    }
  });

  it("hides the Delete action on every row without deleteVersions", async () => {
    mockPermissions({ [DRAFT_ACTIONS.deleteVersions]: false });
    versionRows = threeVersions;

    renderDropdown();
    await openHistory();

    expect(screen.queryByRole("button", { name: /^Delete version/ })).toBeNull();
    expect(screen.getAllByRole("button", { name: /^View version/ })).toHaveLength(2);
  });

  it("delete (collection target) asks for confirmation, then calls deleteVersion with the targeted version", async () => {
    versionRows = threeVersions;
    deleteVersionMock.mockResolvedValue(undefined);

    renderDropdown();
    const user = await openHistory();
    await user.click(screen.getByRole("button", { name: "Delete version 1" }));

    const dialog = screen.getByRole("alertdialog");
    expect(within(dialog).getByText("Delete version 1?")).toBeInTheDocument();
    expect(deleteVersionMock).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() =>
      expect(deleteVersionMock).toHaveBeenCalledWith({
        collection: "posts",
        id: "doc1",
        version: 1,
      }),
    );
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
  });

  it("delete (global target) calls deleteVersion with { global, version } — no documentId invented", async () => {
    versionRows = threeVersions;
    deleteVersionMock.mockResolvedValue(undefined);

    renderDropdown({ target: { global: "announcement" } });
    const user = await openHistory();
    await user.click(screen.getByRole("button", { name: "Delete version 1" }));
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Delete",
      }),
    );

    await waitFor(() =>
      expect(deleteVersionMock).toHaveBeenCalledWith({
        global: "announcement",
        version: 1,
      }),
    );
  });

  it("tags the published version and the active draft as Active", async () => {
    versionRows = threeVersions;

    renderDropdown();
    await openHistory();

    const activeRows = screen
      .getAllByText("Active")
      .map((tag) => within(tag.parentElement!).getByText(/^Version \d$/).textContent);
    expect(activeRows).toEqual(["Version 3", "Version 2"]);
  });

  it("with unsaved changes, asks before switching versions — Cancel stays, Discard switches", async () => {
    versionRows = threeVersions;
    fetchQueryMock.mockResolvedValue({ snapshot: { title: "Old title" }, status: "published" });
    const onViewVersion = vi.fn();

    renderDropdown({ hasUnsavedChanges: true, onViewVersion });
    const user = await openHistory();
    await user.click(screen.getByRole("button", { name: "View version 1" }));

    let dialog = screen.getByRole("alertdialog");
    expect(within(dialog).getByText("Discard unsaved changes?")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(onViewVersion).not.toHaveBeenCalled();

    await openHistory();
    await user.click(screen.getByRole("button", { name: "View version 1" }));
    dialog = screen.getByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Discard changes" }));

    await waitFor(() =>
      expect(onViewVersion).toHaveBeenCalledWith({ version: 1, snapshot: { title: "Old title" } }),
    );
  });

  it("scrolls the version being viewed into view when the menu opens", async () => {
    versionRows = threeVersions;
    const scrolledRows: string[] = [];
    const original = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (this: Element) {
      scrolledRows.push(within(this as HTMLElement).getByText(/^Version \d$/).textContent ?? "");
    };

    renderDropdown({ viewingVersion: 1 });
    await openHistory();

    await waitFor(() => expect(scrolledRows).toEqual(["Version 1"]));
    Element.prototype.scrollIntoView = original;
  });

  it("renders an empty state with no version history", async () => {
    versionRows = [];

    renderDropdown();
    await openHistory();

    expect(screen.getByText("No history yet")).toBeInTheDocument();
    expect(screen.queryAllByRole("button", { name: /^View version/ })).toHaveLength(0);
  });
});
