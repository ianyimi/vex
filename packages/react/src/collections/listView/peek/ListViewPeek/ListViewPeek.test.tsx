import { convexTest } from "convex-test";
import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defineAccess, defineCollection, defineConfig, relationship, text, ui, type VexDocument } from "@vexcms/core";
import { toast } from "sonner";
import {
  LIST_VIEW_PEEK_UNAVAILABLE_DESCRIPTION,
  LIST_VIEW_PEEK_UNAVAILABLE_TITLE,
  ListViewPeek,
} from "./index";
import { renderView } from "../../../../testing/harness/viewHarness";
import { SIDEBAR_TRANSITION_CLASS, SidebarProvider } from "../../../../ui/sidebar";
import schema, { testModules } from "../../../../testing/convex/schema";

// Same toast.success/error pair `ListViewCopyLinkButton.test.tsx` exercises via
// a real `navigator.clipboard` stub — mocked here (rather than asserting on
// the real DOM clipboard write) specifically to assert the TOAST calls
// every copy button now makes (Decision: copy feedback parity round).
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const writeText = vi.fn().mockResolvedValue(true);
Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });

afterEach(() => {
  vi.clearAllMocks();
});


const peekCollection = defineCollection({
  slug: "documents",
  fields: { title: text(), status: text({ label: "Status" }) },
  admin: { useAsTitle: "title" },
});

const access = defineAccess({
  roles: ["editor"] as const,
  resources: [peekCollection],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    editor: { documents: { read: () => ({ title: true, status: false }) } },
  },
});

const editorAuth = { user: { _id: "u1", roles: "editor" } };

describe("ListViewPeek", () => {
  // (No useIsMobile mock to reset — both layouts are always mounted,
  // toggled by CSS classes, never a JS branch.)

  it("renders nothing while peekId is undefined", () => {
    const t = convexTest(schema, testModules);
    const { container } = renderView(
      <ListViewPeek collection={peekCollection} peekId={undefined} rows={[]} onPeekChange={() => {}} width={384} onWidthChange={() => {}} activeTab="fields" onActiveTabChange={() => {}} />,
      { convex: t, config: defineConfig({ collections: [peekCollection] }) },
    );
    expect(container.querySelector('[role="complementary"]')).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });

  it("renders instantly from the already-loaded row, seeded via useVexDocQuery's initialData", async () => {
    const t = convexTest(schema, testModules);
    const id = await t.run((ctx) => ctx.db.insert("documents", { title: "Doc 0", status: "published" }));
    const row: VexDocument = { _id: id, _creationTime: Date.now(), title: "Doc 0", status: "published" };

    renderView(
      <ListViewPeek collection={peekCollection} peekId={id} rows={[row]} onPeekChange={() => {}} width={384} onWidthChange={() => {}} activeTab="fields" onActiveTabChange={() => {}} />,
      { convex: t, config: defineConfig({ collections: [peekCollection] }) },
    );

    // ONE panel now ("Doc 0" appears exactly once, regardless of
    // viewport breakpoint).
    expect(screen.getAllByText("Doc 0").length).toBeGreaterThan(0);
  });

  it("renders without throwing and without the Created row when _creationTime is absent (access can now strip it, new Date(undefined) threw RangeError)", async () => {
    const t = convexTest(schema, testModules);
    const id = await t.run((ctx) => ctx.db.insert("documents", { title: "Doc 0", status: "published" }));
    // Simulates `_creationTime` stripped by access before `document` ever
    // reaches this component — the field map scenario that crashed live.
    const row = {
      _id: id,
      title: "Doc 0",
      status: "published",
    } as unknown as VexDocument;

    const { container } = renderView(
      <ListViewPeek collection={peekCollection} peekId={id} rows={[row]} onPeekChange={() => {}} width={384} onWidthChange={() => {}} activeTab="fields" onActiveTabChange={() => {}} />,
      { convex: t, config: defineConfig({ collections: [peekCollection] }) },
    );

    await waitFor(() => expect(within(container).getByRole("button", { name: "Close" })).toBeInTheDocument());
    // The ID row still shows (always readable) — "Created" does not.
    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.queryByText("Created")).not.toBeInTheDocument();
  });

  it("labels the header's edit-page link \"Edit\" (\"Open\" was ambiguous — it goes straight to the document's edit page)", async () => {
    const t = convexTest(schema, testModules);
    const id = await t.run((ctx) => ctx.db.insert("documents", { title: "Doc 0", status: "published" }));
    const row: VexDocument = { _id: id, _creationTime: Date.now(), title: "Doc 0", status: "published" };

    const { container } = renderView(
      <ListViewPeek collection={peekCollection} peekId={id} rows={[row]} onPeekChange={() => {}} width={384} onWidthChange={() => {}} activeTab="fields" onActiveTabChange={() => {}} />,
      { convex: t, config: defineConfig({ collections: [peekCollection] }) },
    );

    await waitFor(() => expect(within(container).getByRole("button", { name: "Close" })).toBeInTheDocument());
    const editLink = within(container).getByRole("link", { name: "Edit" });
    expect(editLink).toBeInTheDocument();
    expect(within(container).queryByRole("link", { name: "Open" })).not.toBeInTheDocument();
    expect(editLink).toHaveAttribute("href", expect.stringContaining(id));
  });

  it("shows the collection's configured admin.icon in the header avatar instead of initials", async () => {
    const iconCollection = defineCollection({
      slug: "documents",
      fields: { title: text(), status: text({ label: "Status" }) },
      admin: { useAsTitle: "title", icon: "FileText" },
    });
    const t = convexTest(schema, testModules);
    const id = await t.run((ctx) => ctx.db.insert("documents", { title: "Doc 0", status: "published" }));
    const row: VexDocument = { _id: id, _creationTime: Date.now(), title: "Doc 0", status: "published" };

    const { container } = renderView(
      <ListViewPeek collection={iconCollection} peekId={id} rows={[row]} onPeekChange={() => {}} width={384} onWidthChange={() => {}} activeTab="fields" onActiveTabChange={() => {}} />,
      { convex: t, config: defineConfig({ collections: [iconCollection] }) },
    );
    await waitFor(() => expect(within(container).getByRole("button", { name: "Close" })).toBeInTheDocument());
    expect(container.querySelector("svg.lucide-file-text")).toBeInTheDocument();
    // No initials fallback rendered alongside the icon.
    expect(screen.queryByText("DO")).not.toBeInTheDocument();
  });

  it("suspends with the loading skeleton, then resolves to the real document, when peekId isn't among rows", async () => {
    const t = convexTest(schema, testModules);
    const id = await t.run((ctx) => ctx.db.insert("documents", { title: "Streamed doc", status: "published" }));

    renderView(<ListViewPeek collection={peekCollection} peekId={id} rows={[]} onPeekChange={() => {}} width={384} onWidthChange={() => {}} activeTab="fields" onActiveTabChange={() => {}} />, {
      convex: t,
      config: defineConfig({ collections: [peekCollection] }),
    });

    // `useSuspenseVexDocQuery` genuinely suspends (no `initialData` seed — that mechanism
    // was `CollectionListViewProps.initialPeekDoc`/`ListViewPeek.initialDoc`, deleted),
    // `ListViewPeek`'s own `<Suspense>` wrapper shows `ListPeekPanel`'s
    // "document: undefined" skeleton branch first (same loading UI this file always had),
    // THEN swaps to the real content once the `convex-test` backend resolves the query —
    // proves the Suspense boundary itself works, not just the already-loaded-row fast path
    // the test above covers.
    await waitFor(() => {
      expect(screen.getAllByText("Streamed doc").length).toBeGreaterThan(0);
    });
  });

  it("renders the same message for a not-found id as for a denied read", async () => {
    const t = convexTest(schema, testModules);
    const id = await t.run(async (ctx) => {
      const docId = await ctx.db.insert("documents", { title: "Doc 0" });
      await ctx.db.delete(docId);
      return docId;
    });

    renderView(
      <ListViewPeek collection={peekCollection} peekId={id} rows={[]} onPeekChange={() => {}} width={384} onWidthChange={() => {}} activeTab="fields" onActiveTabChange={() => {}} />,
      { convex: t, config: defineConfig({ collections: [peekCollection] }) },
    );

    await waitFor(() =>
      expect(screen.getAllByText(LIST_VIEW_PEEK_UNAVAILABLE_TITLE).length).toBeGreaterThan(0),
    );
    expect(screen.getAllByText(LIST_VIEW_PEEK_UNAVAILABLE_DESCRIPTION).length).toBeGreaterThan(0);
  });

  it("omits a field the caller cannot read from the Fields tab, and shows a hidden-fields notice (reuses useVisibleFields, the same hook CollectionEditView uses)", async () => {
    const t = convexTest(schema, testModules);
    const id = await t.run((ctx) => ctx.db.insert("documents", { title: "Doc 0", status: "published" }));
    const row: VexDocument = { _id: id, _creationTime: Date.now(), title: "Doc 0", status: "published" };

    renderView(
      <ListViewPeek collection={peekCollection} peekId={id} rows={[row]} onPeekChange={() => {}} width={384} onWidthChange={() => {}} activeTab="fields" onActiveTabChange={() => {}} />,
      { convex: t, config: defineConfig({ collections: [peekCollection] }), access, auth: editorAuth },
    );

    await waitFor(() => expect(screen.getAllByText("Doc 0").length).toBeGreaterThan(0));
    expect(screen.queryByText("published")).not.toBeInTheDocument();
    expect(screen.getAllByText("Some fields are hidden by your permissions.").length).toBeGreaterThan(0);
  });

  it("shows no hidden-fields notice when every field is readable", async () => {
    const t = convexTest(schema, testModules);
    const id = await t.run((ctx) => ctx.db.insert("documents", { title: "Doc 0", status: "published" }));
    const row: VexDocument = { _id: id, _creationTime: Date.now(), title: "Doc 0", status: "published" };

    renderView(
      <ListViewPeek collection={peekCollection} peekId={id} rows={[row]} onPeekChange={() => {}} width={384} onWidthChange={() => {}} activeTab="fields" onActiveTabChange={() => {}} />,
      { convex: t, config: defineConfig({ collections: [peekCollection] }) },
    );

    await waitFor(() => expect(screen.getAllByText("Doc 0").length).toBeGreaterThan(0));
    expect(screen.queryByText("Some fields are hidden by your permissions.")).not.toBeInTheDocument();
  });

  it("hides the Created row when _creationTime is unreadable (hidden unless listed, no wildcard) — the ID row is unaffected", async () => {
    const t = convexTest(schema, testModules);
    const id = await t.run((ctx) => ctx.db.insert("documents", { title: "Doc 0", status: "published" }));
    const row: VexDocument = { _id: id, _creationTime: Date.now(), title: "Doc 0", status: "published" };

    renderView(
      <ListViewPeek collection={peekCollection} peekId={id} rows={[row]} onPeekChange={() => {}} width={384} onWidthChange={() => {}} activeTab="fields" onActiveTabChange={() => {}} />,
      { convex: t, config: defineConfig({ collections: [peekCollection] }), access, auth: editorAuth },
    );
    await waitFor(() => expect(screen.getAllByText("Doc 0").length).toBeGreaterThan(0));
    expect(screen.queryByText("Created")).not.toBeInTheDocument();
    // The ID row is unaffected — always readable, regardless of role.
    expect(screen.getByText("ID")).toBeInTheDocument();
  });

  it("omits _creationTime from the JSON tab when the field is unreadable, _id stays", async () => {
    const t = convexTest(schema, testModules);
    const id = await t.run((ctx) => ctx.db.insert("documents", { title: "Doc 0", status: "published" }));
    const row: VexDocument = { _id: id, _creationTime: Date.now(), title: "Doc 0", status: "published" };

    const { container } = renderView(
      <ListViewPeek collection={peekCollection} peekId={id} rows={[row]} onPeekChange={() => {}} width={384} onWidthChange={() => {}} activeTab="json" onActiveTabChange={() => {}} />,
      { convex: t, config: defineConfig({ collections: [peekCollection] }), access, auth: editorAuth },
    );
    const jsonText = await waitFor(() => {
      const content = container.querySelector(".cm-content")?.textContent ?? "";
      expect(content).not.toBe("");
      return content;
    });
    expect(jsonText).not.toContain("_creationTime");
    expect(jsonText).toContain("_id");
  });

  it("shows the hidden-fields notice when a system field is unreadable, even if every data field is readable", async () => {
    const sysFieldCollection = defineCollection({
      slug: "documents",
      fields: { title: text() },
      admin: { useAsTitle: "title" },
    });
    const sysFieldAccess = defineAccess({
      roles: ["editor"] as const,
      resources: [sysFieldCollection],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        // Every DATA field readable (title) — _creationTime unlisted, no
        // wildcard, so it's hidden and is the ONLY source
        // of a hidden field here, isolating the system-field count.
        editor: { documents: { read: () => ({ title: true }) } },
      },
    });
    const t = convexTest(schema, testModules);
    const id = await t.run((ctx) => ctx.db.insert("documents", { title: "Doc 0" }));
    const row: VexDocument = { _id: id, _creationTime: Date.now(), title: "Doc 0" };

    renderView(
      <ListViewPeek collection={sysFieldCollection} peekId={id} rows={[row]} onPeekChange={() => {}} width={384} onWidthChange={() => {}} activeTab="fields" onActiveTabChange={() => {}} />,
      { convex: t, config: defineConfig({ collections: [sysFieldCollection] }), access: sysFieldAccess, auth: editorAuth },
    );

    await waitFor(() => expect(screen.getAllByText("Doc 0").length).toBeGreaterThan(0));
    expect(screen.getAllByText("Some fields are hidden by your permissions.").length).toBeGreaterThan(0);
  });

  it("shows the hidden-fields notice when updatedAt is unreadable on a NON-versioned collection (Main's correction: defineCollection injects updatedAt into every collection unless timestamps: false — not versioning-specific, unlike vex_status)", async () => {
    const updatedAtCollection = defineCollection({
      slug: "documents",
      fields: { title: text() },
      admin: { useAsTitle: "title" },
      // No `versions: { drafts: true }` — deliberately non-versioned, and
      // no `timestamps: false` — `updatedAt` is still auto-injected.
    });
    const updatedAtAccess = defineAccess({
      roles: ["editor"] as const,
      resources: [updatedAtCollection],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        // title + _creationTime readable; updatedAt unlisted → hidden —
        // the only source of a hidden field here. Handled entirely by
        // the EXISTING conditionFields/useVisibleFields pipeline
        // (updatedAt is a real dataFields entry), not this file's own
        // GATEABLE_SYSTEM_FIELD_KEYS special-casing, which deliberately
        // excludes updatedAt.
        editor: { documents: { read: () => ({ title: true, _creationTime: true }) } },
      },
    });
    const t = convexTest(schema, testModules);
    const id = await t.run((ctx) => ctx.db.insert("documents", { title: "Doc 0" }));
    const row: VexDocument = { _id: id, _creationTime: Date.now(), title: "Doc 0" };

    renderView(
      <ListViewPeek collection={updatedAtCollection} peekId={id} rows={[row]} onPeekChange={() => {}} width={384} onWidthChange={() => {}} activeTab="fields" onActiveTabChange={() => {}} />,
      { convex: t, config: defineConfig({ collections: [updatedAtCollection] }), access: updatedAtAccess, auth: editorAuth },
    );

    await waitFor(() => expect(screen.getAllByText("Doc 0").length).toBeGreaterThan(0));
    expect(screen.queryByText("Updated At")).not.toBeInTheDocument();
    expect(screen.getAllByText("Some fields are hidden by your permissions.").length).toBeGreaterThan(0);
  });

  it("counts an unreadable ui() field toward the hidden-fields notice, even though a ui() field never renders a Fields-tab row either way", async () => {
    const uiFieldCollection = defineCollection({
      slug: "documents",
      fields: { title: text(), wordCount: ui({ admin: { components: { Field: () => null } } }) },
      admin: { useAsTitle: "title" },
    });
    const uiFieldAccess = defineAccess({
      roles: ["editor"] as const,
      resources: [uiFieldCollection],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        // title + _creationTime readable; wordCount (a ui() field,
        // gateable under the SAME rule, Decision) unlisted → hidden —
        // the only source of a hidden field here.
        editor: { documents: { read: () => ({ title: true, _creationTime: true }) } },
      },
    });
    const t = convexTest(schema, testModules);
    const id = await t.run((ctx) => ctx.db.insert("documents", { title: "Doc 0" }));
    const row: VexDocument = { _id: id, _creationTime: Date.now(), title: "Doc 0" };

    renderView(
      <ListViewPeek collection={uiFieldCollection} peekId={id} rows={[row]} onPeekChange={() => {}} width={384} onWidthChange={() => {}} activeTab="fields" onActiveTabChange={() => {}} />,
      { convex: t, config: defineConfig({ collections: [uiFieldCollection] }), access: uiFieldAccess, auth: editorAuth },
    );

    await waitFor(() => expect(screen.getAllByText("Doc 0").length).toBeGreaterThan(0));
    expect(screen.getAllByText("Some fields are hidden by your permissions.").length).toBeGreaterThan(0);
  });

  it("strips hasUnpublishedChanges from the JSON tab — a computed flag mergeDraftCounterparts attaches, never a real stored Convex column", async () => {
    const t = convexTest(schema, testModules);
    const id = await t.run((ctx) => ctx.db.insert("documents", { title: "Doc 0", status: "published" }));
    // Simulates what the list query's own merge step actually hands
    // `ListViewPeek` via `props.rows` for a versioned collection's row — the
    // SAME extra property `CollectionListView.tsx`'s own `buildStatusColumn`
    // reads for its Status-column badge, never present in the raw table row.
    // The JSON tab's own depth-0 `get` fetch (structural fix, superseding
    // an earlier explicit `delete jsonDoc.hasUnpublishedChanges`) never
    // sees this prop at all — it reads fresh from Convex, not from `row`.
    const row = {
      _id: id,
      _creationTime: Date.now(),
      title: "Doc 0",
      status: "published",
      hasUnpublishedChanges: true,
    } as unknown as VexDocument;

    const { container } = renderView(
      <ListViewPeek collection={peekCollection} peekId={id} rows={[row]} onPeekChange={() => {}} width={384} onWidthChange={() => {}} activeTab="json" onActiveTabChange={() => {}} />,
      { convex: t, config: defineConfig({ collections: [peekCollection] }) },
    );

    await waitFor(() => expect(within(container).getByRole("button", { name: "Close" })).toBeInTheDocument());
    const jsonText = await waitFor(() => {
      const content = container.querySelector(".cm-content")?.textContent ?? "";
      expect(content).not.toBe("");
      return content;
    });
    expect(jsonText).not.toContain("hasUnpublishedChanges");
    // Real stored keys stay — this isn't a blanket strip, just the one
    // known computed property.
    expect(jsonText).toContain("Doc 0");
    expect(jsonText).toContain("published");
  });

  it("Fields tab still resolves the populated relationship title (depth: 1, from the seeded list row) — unaffected by the JSON tab's own raw fetch", async () => {
    const relCollection = defineCollection({
      slug: "documents",
      fields: { title: text(), related: relationship({ collection: { slug: "documents" } }) },
      admin: { useAsTitle: "title" },
    });
    const t = convexTest(schema, testModules);
    const targetId = await t.run((ctx) => ctx.db.insert("documents", { title: "Target Doc" }));
    const id = await t.run((ctx) => ctx.db.insert("documents", { title: "Doc 0", related: [targetId] }));
    // What `usePaginatedQuery`'s own `depth: 1` actually hands `ListViewPeek`
    // via `props.rows` — the related doc's full fields, not just its id.
    const populatedRow = {
      _id: id,
      _creationTime: Date.now(),
      title: "Doc 0",
      related: [{ _id: targetId, _creationTime: Date.now(), title: "Target Doc" }],
    } as unknown as VexDocument;

    renderView(
      <ListViewPeek collection={relCollection} peekId={id} rows={[populatedRow]} onPeekChange={() => {}} width={384} onWidthChange={() => {}} activeTab="fields" onActiveTabChange={() => {}} />,
      { convex: t, config: defineConfig({ collections: [relCollection] }) },
    );

    // Reads `document` (the populated prop) — unaffected by the JSON
    // tab's own separate depth-0 fetch (below).
    await waitFor(() => expect(screen.getAllByText("Target Doc").length).toBeGreaterThan(0));
  });

  it("shows a raw relationship id in the JSON tab, not the populated document (find's own depth: 1 population leaked into the JSON tab via the seeded list row)", async () => {
    const relCollection = defineCollection({
      slug: "documents",
      fields: { title: text(), related: relationship({ collection: { slug: "documents" } }) },
      admin: { useAsTitle: "title" },
    });
    const t = convexTest(schema, testModules);
    const targetId = await t.run((ctx) => ctx.db.insert("documents", { title: "Target Doc" }));
    const id = await t.run((ctx) => ctx.db.insert("documents", { title: "Doc 0", related: [targetId] }));
    const populatedRow = {
      _id: id,
      _creationTime: Date.now(),
      title: "Doc 0",
      related: [{ _id: targetId, _creationTime: Date.now(), title: "Target Doc" }],
    } as unknown as VexDocument;

    const { container } = renderView(
      <ListViewPeek collection={relCollection} peekId={id} rows={[populatedRow]} onPeekChange={() => {}} width={384} onWidthChange={() => {}} activeTab="json" onActiveTabChange={() => {}} />,
      { convex: t, config: defineConfig({ collections: [relCollection] }) },
    );

    // The raw stored id, never the populated object — sourced from the
    // panel's own separate depth-0 `get` fetch, not `document`.
    const jsonText = await waitFor(() => {
      const content = container.querySelector(".cm-content")?.textContent ?? "";
      expect(content).not.toBe("");
      return content;
    });
    expect(jsonText).toContain(targetId);
    expect(jsonText).not.toContain("Target Doc");
  });

  it("toasts a confirmation when a copy button is clicked (same toast.success/error pattern as ListViewCopyLinkButton/ListViewRowCopyIdAction)", async () => {
    const t = convexTest(schema, testModules);
    const id = await t.run((ctx) => ctx.db.insert("documents", { title: "Doc 0", status: "published" }));
    const row: VexDocument = { _id: id, _creationTime: Date.now(), title: "Doc 0", status: "published" };

    const { container } = renderView(
      <ListViewPeek collection={peekCollection} peekId={id} rows={[row]} onPeekChange={() => {}} width={384} onWidthChange={() => {}} activeTab="fields" onActiveTabChange={() => {}} />,
      { convex: t, config: defineConfig({ collections: [peekCollection] }) },
    );

    await waitFor(() => expect(screen.getAllByText("Doc 0").length).toBeGreaterThan(0));
    fireEvent.click(within(container).getByRole("button", { name: "Copy ID" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(id));
    expect(toast.success).toHaveBeenCalledWith("Copied ID");
  });

  it("steps to the neighbouring row via the header's Previous/Next buttons", async () => {
    const t = convexTest(schema, testModules);
    const id0 = await t.run((ctx) => ctx.db.insert("documents", { title: "Doc 0" }));
    const id1 = await t.run((ctx) => ctx.db.insert("documents", { title: "Doc 1" }));
    const id2 = await t.run((ctx) => ctx.db.insert("documents", { title: "Doc 2" }));
    const rows: VexDocument[] = [
      { _id: id0, _creationTime: 1, title: "Doc 0" },
      { _id: id1, _creationTime: 2, title: "Doc 1" },
      { _id: id2, _creationTime: 3, title: "Doc 2" },
    ];
    const onPeekChange = vi.fn();

    const { container } = renderView(
      <ListViewPeek collection={peekCollection} peekId={id1} rows={rows} onPeekChange={onPeekChange} width={384} onWidthChange={() => {}} activeTab="fields" onActiveTabChange={() => {}} />,
      { convex: t, config: defineConfig({ collections: [peekCollection] }) },
    );

    await waitFor(() => expect(screen.getAllByText("Doc 1").length).toBeGreaterThan(0));
    // Scoped to `container`, not `screen`: both layouts render the same
    // header, and the Sheet's bottom-sheet copy lives in a
    // separate portal outside `container` — scoping avoids the duplicate
    // match without relying on `modal`-driven `inert` exclusion (removed,
    // since the list stays interactive now too).
    fireEvent.click(within(container).getByRole("button", { name: "Previous row" }));
    expect(onPeekChange).toHaveBeenCalledWith(id0);

    fireEvent.click(within(container).getByRole("button", { name: "Next row" }));
    expect(onPeekChange).toHaveBeenCalledWith(id2);
  });

  it("Previous on the first row wraps to the last, Next on the last wraps to the first", async () => {
    const t = convexTest(schema, testModules);
    const id0 = await t.run((ctx) => ctx.db.insert("documents", { title: "Doc 0" }));
    const id1 = await t.run((ctx) => ctx.db.insert("documents", { title: "Doc 1" }));
    const id2 = await t.run((ctx) => ctx.db.insert("documents", { title: "Doc 2" }));
    const rows: VexDocument[] = [
      { _id: id0, _creationTime: 1, title: "Doc 0" },
      { _id: id1, _creationTime: 2, title: "Doc 1" },
      { _id: id2, _creationTime: 3, title: "Doc 2" },
    ];
    const onPeekChange = vi.fn();

    // On the FIRST row: Previous wraps to the LAST.
    const { container, unmount } = renderView(
      <ListViewPeek collection={peekCollection} peekId={id0} rows={rows} onPeekChange={onPeekChange} width={384} onWidthChange={() => {}} activeTab="fields" onActiveTabChange={() => {}} />,
      { convex: t, config: defineConfig({ collections: [peekCollection] }) },
    );
    await waitFor(() => expect(screen.getAllByText("Doc 0").length).toBeGreaterThan(0));
    const previousButton = within(container).getByRole("button", { name: "Previous row" });
    expect(previousButton).toBeEnabled();
    fireEvent.click(previousButton);
    expect(onPeekChange).toHaveBeenCalledWith(id2);
    unmount();

    // On the LAST row: Next wraps to the FIRST.
    onPeekChange.mockClear();
    const { container: container2 } = renderView(
      <ListViewPeek collection={peekCollection} peekId={id2} rows={rows} onPeekChange={onPeekChange} width={384} onWidthChange={() => {}} activeTab="fields" onActiveTabChange={() => {}} />,
      { convex: t, config: defineConfig({ collections: [peekCollection] }) },
    );
    await waitFor(() => expect(screen.getAllByText("Doc 2").length).toBeGreaterThan(0));
    const nextButton = within(container2).getByRole("button", { name: "Next row" });
    expect(nextButton).toBeEnabled();
    fireEvent.click(nextButton);
    expect(onPeekChange).toHaveBeenCalledWith(id0);
  });

  it("disables both Previous and Next when only a single row is loaded", async () => {
    const t = convexTest(schema, testModules);
    const id0 = await t.run((ctx) => ctx.db.insert("documents", { title: "Doc 0" }));
    const rows: VexDocument[] = [{ _id: id0, _creationTime: 1, title: "Doc 0" }];

    const { container } = renderView(
      <ListViewPeek collection={peekCollection} peekId={id0} rows={rows} onPeekChange={() => {}} width={384} onWidthChange={() => {}} activeTab="fields" onActiveTabChange={() => {}} />,
      { convex: t, config: defineConfig({ collections: [peekCollection] }) },
    );
    await waitFor(() => expect(screen.getAllByText("Doc 0").length).toBeGreaterThan(0));
    expect(within(container).getByRole("button", { name: "Previous row" })).toBeDisabled();
    expect(within(container).getByRole("button", { name: "Next row" })).toBeDisabled();
  });

  it("disables both Previous and Next for a deep-linked peek outside the loaded rows (rowIndex -1, no list to wrap within)", async () => {
    const t = convexTest(schema, testModules);
    const id = await t.run((ctx) => ctx.db.insert("documents", { title: "Streamed doc" }));

    const { container } = renderView(
      <ListViewPeek collection={peekCollection} peekId={id} rows={[]} onPeekChange={() => {}} width={384} onWidthChange={() => {}} activeTab="fields" onActiveTabChange={() => {}} />,
      { convex: t, config: defineConfig({ collections: [peekCollection] }) },
    );
    await waitFor(() => expect(screen.getAllByText("Streamed doc").length).toBeGreaterThan(0));
    expect(within(container).getByRole("button", { name: "Previous row" })).toBeDisabled();
    expect(within(container).getByRole("button", { name: "Next row" })).toBeDisabled();
  });

  it("renders ONE panel — fixed, right-docked classes for md+, bottom-sheet classes for mobile, same element either way (one peek panel, never two layouts at once)", async () => {
    const t = convexTest(schema, testModules);
    const id = await t.run((ctx) => ctx.db.insert("documents", { title: "Doc 0" }));

    const { container } = renderView(
      <ListViewPeek collection={peekCollection} peekId={id} rows={[]} onPeekChange={() => {}} width={384} onWidthChange={() => {}} activeTab="fields" onActiveTabChange={() => {}} />,
      { convex: t, config: defineConfig({ collections: [peekCollection] }) },
    );

    await waitFor(() => expect(within(container).getByRole("button", { name: "Close" })).toBeInTheDocument());
    // Exactly ONE `[role=complementary]` in the whole document — no second,
    // always-mounted layout anymore.
    expect(container.querySelectorAll('[role="complementary"]')).toHaveLength(1);
    const panel = container.querySelector('[role="complementary"]') as HTMLElement;
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveAttribute("aria-label", "Document preview");
    // Mobile (bottom sheet) shape classes.
    expect(panel.className).toContain("fixed");
    expect(panel.className).toContain("inset-x-0");
    expect(panel.className).toContain("bottom-0");
    expect(panel.className).toContain("rounded-t-xl");
    // Desktop (right panel) shape classes, `md:`-scoped.
    expect(panel.className).toContain("md:right-[var(--peek-sidebar-offset)]");
    expect(panel.className).toContain("md:w-[var(--peek-width)]");
    expect(panel.className).toContain("md:rounded-none");
    // Width is a CSS custom property — only consumed by the `md:w-[var(--peek-width)]`
    // utility, so the mobile shape stays full-width regardless.
    expect(panel.style.getPropertyValue("--peek-width")).toBe("384px");
    // Sidebar-aware positioning — `0px` outside a `SidebarProvider` (the test
    // harness's own case) or when the sidebar isn't on the colliding
    // (right) side.
    expect(panel.style.getPropertyValue("--peek-sidebar-offset")).toBe("0px");
    // The mobile-only dim backdrop is a sibling, `md:hidden`,
    // `pointer-events-none` so the list stays interactive underneath.
    const backdrop = container.querySelector('[aria-hidden="true"].md\\:hidden');
    expect(backdrop).toBeInTheDocument();
    expect(backdrop!.className).toContain("pointer-events-none");
  });

  it("keeps the peek open when clicking Previous/Next, a tab, or a copy button (any click inside used to close it)", async () => {
    const t = convexTest(schema, testModules);
    const id0 = await t.run((ctx) => ctx.db.insert("documents", { title: "Doc 0" }));
    const id1 = await t.run((ctx) => ctx.db.insert("documents", { title: "Doc 1" }));
    const rows: VexDocument[] = [
      { _id: id0, _creationTime: 1, title: "Doc 0" },
      { _id: id1, _creationTime: 2, title: "Doc 1" },
    ];
    const onPeekChange = vi.fn();

    const { container } = renderView(
      <ListViewPeek collection={peekCollection} peekId={id0} rows={rows} onPeekChange={onPeekChange} width={384} onWidthChange={() => {}} activeTab="fields" onActiveTabChange={() => {}} />,
      { convex: t, config: defineConfig({ collections: [peekCollection] }) },
    );

    await waitFor(() => expect(within(container).getByRole("button", { name: "Close" })).toBeInTheDocument());

    // Historical root cause (fixed 2026-11-01 via `disablePointerDismissal`
    // on the then-separate, always-mounted Base UI `Sheet`, now MOOT: the
    // peek is a plain `div` with no Dialog primitive at all — Decision
    // "one peek panel, never two layouts at once" — so there is no
    // "outside press" dismissal concept left to misfire in the first
    // place). Kept as a regression guard: clicking controls INSIDE the
    // panel must never close it.
    fireEvent.click(within(container).getByRole("button", { name: "Next row" }));
    fireEvent.click(within(container).getByRole("tab", { name: "JSON" }));
    fireEvent.click(within(container).getByRole("button", { name: "Copy ID" }));
    expect(onPeekChange).not.toHaveBeenCalledWith(undefined);

    // Only the explicit ✕ still closes it.
    fireEvent.click(within(container).getByRole("button", { name: "Close" }));
    expect(onPeekChange).toHaveBeenCalledWith(undefined);
  });

  it("Escape closes the panel, rebuilding what Base UI's Dialog used to provide", async () => {
    const t = convexTest(schema, testModules);
    const id = await t.run((ctx) => ctx.db.insert("documents", { title: "Doc 0" }));
    const onPeekChange = vi.fn();

    const { container } = renderView(
      <ListViewPeek collection={peekCollection} peekId={id} rows={[]} onPeekChange={onPeekChange} width={384} onWidthChange={() => {}} activeTab="fields" onActiveTabChange={() => {}} />,
      { convex: t, config: defineConfig({ collections: [peekCollection] }) },
    );
    await waitFor(() => expect(within(container).getByRole("button", { name: "Close" })).toBeInTheDocument());

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onPeekChange).toHaveBeenCalledWith(undefined);
  });

  it("hides the resize handle group on mobile (`hidden md:contents` — desktop-only, resize is a md+-only affordance)", async () => {
    const t = convexTest(schema, testModules);
    const id = await t.run((ctx) => ctx.db.insert("documents", { title: "Doc 0" }));

    const { container } = renderView(
      <ListViewPeek collection={peekCollection} peekId={id} rows={[]} onPeekChange={() => {}} width={384} onWidthChange={() => {}} activeTab="fields" onActiveTabChange={() => {}} />,
      { convex: t, config: defineConfig({ collections: [peekCollection] }) },
    );

    await waitFor(() => expect(within(container).getByRole("button", { name: "Close" })).toBeInTheDocument());
    const handle = within(container).getByRole("separator", { name: "Resize preview width" });
    expect(handle.parentElement!.className).toContain("hidden");
    expect(handle.parentElement!.className).toContain("md:contents");
  });

  it("disables and greys out the copy button for a field with an empty value, with no toast on click", async () => {
    const t = convexTest(schema, testModules);
    const id = await t.run((ctx) => ctx.db.insert("documents", { title: "Doc 0", status: "" }));
    const row: VexDocument = { _id: id, _creationTime: Date.now(), title: "Doc 0", status: "" };

    const { container } = renderView(
      <ListViewPeek collection={peekCollection} peekId={id} rows={[row]} onPeekChange={() => {}} width={384} onWidthChange={() => {}} activeTab="fields" onActiveTabChange={() => {}} />,
      { convex: t, config: defineConfig({ collections: [peekCollection] }) },
    );

    await waitFor(() => expect(screen.getAllByText("Doc 0").length).toBeGreaterThan(0));
    const copyStatusButton = within(container).getByRole("button", { name: "Copy Status" });
    expect(copyStatusButton).toBeDisabled();

    fireEvent.click(copyStatusButton);
    expect(writeText).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  describe("resize", () => {
    async function renderResizable(onWidthChange: (width: number | undefined) => void, width = 400) {
      const t = convexTest(schema, testModules);
      const id = await t.run((ctx) => ctx.db.insert("documents", { title: "Doc 0" }));
      const row: VexDocument = { _id: id, _creationTime: Date.now(), title: "Doc 0" };
      const { container } = renderView(
        <ListViewPeek collection={peekCollection} peekId={id} rows={[row]} onPeekChange={() => {}} width={width} onWidthChange={onWidthChange} activeTab="fields" onActiveTabChange={() => {}} />,
        { convex: t, config: defineConfig({ collections: [peekCollection] }) },
      );
      await waitFor(() => expect(screen.getAllByText("Doc 0").length).toBeGreaterThan(0));
      return { handle: screen.getByRole("separator", { name: "Resize preview width" }), container };
    }

    it("drags the handle left to grow the panel, committing the final width on mouseup", async () => {
      const onWidthChange = vi.fn();
      const { handle } = await renderResizable(onWidthChange);

      fireEvent.mouseDown(handle, { clientX: 500, button: 0 });
      fireEvent.mouseMove(document, { clientX: 450 });
      expect(onWidthChange).not.toHaveBeenCalled();
      fireEvent.mouseUp(document);

      expect(onWidthChange).toHaveBeenCalledWith(450);
    });

    it("drags the handle right to shrink the panel", async () => {
      const onWidthChange = vi.fn();
      const { handle } = await renderResizable(onWidthChange);

      fireEvent.mouseDown(handle, { clientX: 500, button: 0 });
      fireEvent.mouseMove(document, { clientX: 540 });
      fireEvent.mouseUp(document);

      expect(onWidthChange).toHaveBeenCalledWith(360);
    });

    it("clamps a drag past the minimum/maximum to PEEK_PANEL_MIN_WIDTH_PX/60% of the viewport", async () => {
      const onWidthChange = vi.fn();
      const { handle } = await renderResizable(onWidthChange);

      fireEvent.mouseDown(handle, { clientX: 500, button: 0 });
      fireEvent.mouseMove(document, { clientX: 2000 });
      fireEvent.mouseUp(document);
      expect(onWidthChange).toHaveBeenCalledWith(320);

      onWidthChange.mockClear();
      cleanup();
      const { handle: handle2 } = await renderResizable(onWidthChange);
      fireEvent.mouseDown(handle2, { clientX: 500, button: 0 });
      fireEvent.mouseMove(document, { clientX: -5000 });
      fireEvent.mouseUp(document);
      expect(onWidthChange).toHaveBeenCalledWith(Math.round(window.innerWidth * 0.6));
    });

    it("clamps an oversized STORED width for display only, without writing back the clamped value", async () => {
      // A width saved while the panel had more room (sidebar collapsed, a
      // wider viewport, a different view's own wider saved width) must
      // still render at today's max rather than overflow — but the
      // clamp must be purely a render-time DERIVATION: `onWidthChange`
      // is never called just from mounting with an oversized `width`,
      // so the original value is still there the moment room reopens.
      const onWidthChange = vi.fn();
      const oversized = Math.round(window.innerWidth * 0.6) + 500;
      const { container } = await renderResizable(onWidthChange, oversized);

      const panel = container.querySelector('[role="complementary"]') as HTMLElement;
      expect(panel.style.getPropertyValue("--peek-width")).toBe(`${Math.round(window.innerWidth * 0.6)}px`);
      expect(onWidthChange).not.toHaveBeenCalled();
    });

    it("ArrowLeft grows and ArrowRight shrinks the width by a fixed step via the keyboard", async () => {
      const onWidthChange = vi.fn();
      const { handle } = await renderResizable(onWidthChange);

      fireEvent.keyDown(handle, { key: "ArrowLeft" });
      expect(onWidthChange).toHaveBeenCalledWith(412);

      onWidthChange.mockClear();
      fireEvent.keyDown(handle, { key: "ArrowRight" });
      expect(onWidthChange).toHaveBeenCalledWith(388);
    });

    it("shows a Reset peek width button on handle hover/focus, which clears the saved width", async () => {
      const onWidthChange = vi.fn();
      const { handle } = await renderResizable(onWidthChange);

      expect(screen.queryByRole("button", { name: "Reset peek width" })).not.toBeInTheDocument();
      fireEvent.mouseEnter(handle);
      const resetButton = screen.getByRole("button", { name: "Reset peek width" });
      fireEvent.click(resetButton);
      expect(onWidthChange).toHaveBeenCalledWith(undefined);
    });

    it("double-clicking the handle also resets the width", async () => {
      const onWidthChange = vi.fn();
      const { handle } = await renderResizable(onWidthChange);
      fireEvent.doubleClick(handle);
      expect(onWidthChange).toHaveBeenCalledWith(undefined);
    });
  });

  describe("sidebar-sync transition (offset jumped instantly while the sidebar itself animated)", () => {
    async function renderPanel(width = 400) {
      const t = convexTest(schema, testModules);
      const id = await t.run((ctx) => ctx.db.insert("documents", { title: "Doc 0" }));
      const row: VexDocument = { _id: id, _creationTime: Date.now(), title: "Doc 0" };
      const { container } = renderView(
        <ListViewPeek collection={peekCollection} peekId={id} rows={[row]} onPeekChange={() => {}} width={width} onWidthChange={() => {}} activeTab="fields" onActiveTabChange={() => {}} />,
        { convex: t, config: defineConfig({ collections: [peekCollection] }) },
      );
      await waitFor(() => expect(screen.getAllByText("Doc 0").length).toBeGreaterThan(0));
      const panel = container.querySelector('[role="complementary"]') as HTMLElement;
      const handle = screen.getByRole("separator", { name: "Resize preview width" });
      return { panel, handle };
    }

    it("carries the sidebar's own duration/easing once mounted (not dragging)", async () => {
      const { panel } = await renderPanel();
      // Shares SIDEBAR_TRANSITION_CLASS's own "duration-200 ease-linear"
      // tokens (asserted below) — a literal class, not built from that
      // constant at runtime (Tailwind's scanner needs a literal string
      // in source), so this test is what actually keeps the two in
      // sync: a change to either must deliberately update both.
      expect(panel.className).toContain("md:transition-[right]");
      expect(panel.className).toContain("md:duration-200");
      expect(panel.className).toContain("md:ease-linear");
      expect(SIDEBAR_TRANSITION_CLASS).toContain("duration-200");
      expect(SIDEBAR_TRANSITION_CLASS).toContain("ease-linear");
    });

    it("suspends the transition while a resize drag is live, so width tracks the cursor instantly", async () => {
      const { panel, handle } = await renderPanel();
      expect(panel.className).toContain("md:transition-[right]");

      // `liveDragWidth` (the gate) only becomes non-null once a drag
      // actually produces a width delta, on the first `mousemove` — a
      // bare `mousedown` alone doesn't flip it yet, matching
      // `startResize`'s own `handleMove`/`setLiveDragWidth` split.
      fireEvent.mouseDown(handle, { clientX: 500, button: 0 });
      fireEvent.mouseMove(document, { clientX: 450 });
      expect(panel.className).not.toContain("md:transition-[right]");

      fireEvent.mouseUp(document);
      await waitFor(() => expect(panel.className).toContain("md:transition-[right]"));
    });
  });

  describe("tab memory", () => {
    it("opens on the remembered tab from activeTab (SSR-resolved, no flash)", async () => {
      const t = convexTest(schema, testModules);
      const id = await t.run((ctx) => ctx.db.insert("documents", { title: "Doc 0" }));
      const row: VexDocument = { _id: id, _creationTime: Date.now(), title: "Doc 0" };

      const { container } = renderView(
        <ListViewPeek collection={peekCollection} peekId={id} rows={[row]} onPeekChange={() => {}} width={384} onWidthChange={() => {}} activeTab="json" onActiveTabChange={() => {}} />,
        { convex: t, config: defineConfig({ collections: [peekCollection] }) },
      );
      await waitFor(() => expect(within(container).getByRole("button", { name: "Close" })).toBeInTheDocument());
      const jsonTab = within(container).getByRole("tab", { name: "JSON" });
      expect(jsonTab).toHaveAttribute("aria-selected", "true");
    });

    it("calls onActiveTabChange when the user switches tabs", async () => {
      const t = convexTest(schema, testModules);
      const id = await t.run((ctx) => ctx.db.insert("documents", { title: "Doc 0" }));
      const row: VexDocument = { _id: id, _creationTime: Date.now(), title: "Doc 0" };
      const onActiveTabChange = vi.fn();

      const { container } = renderView(
        <ListViewPeek collection={peekCollection} peekId={id} rows={[row]} onPeekChange={() => {}} width={384} onWidthChange={() => {}} activeTab="fields" onActiveTabChange={onActiveTabChange} />,
        { convex: t, config: defineConfig({ collections: [peekCollection] }) },
      );
      await waitFor(() => expect(within(container).getByRole("button", { name: "Close" })).toBeInTheDocument());
      fireEvent.click(within(container).getByRole("tab", { name: "JSON" }));
      expect(onActiveTabChange).toHaveBeenCalledWith("json");
    });
  });

  describe("sidebar-aware positioning", () => {
    async function renderWithSidebar(config: ReturnType<typeof defineConfig>, defaultOpen: boolean) {
      const t = convexTest(schema, testModules);
      const id = await t.run((ctx) => ctx.db.insert("documents", { title: "Doc 0" }));
      const row: VexDocument = { _id: id, _creationTime: Date.now(), title: "Doc 0" };
      const { container } = renderView(
        <SidebarProvider defaultOpen={defaultOpen}>
          <ListViewPeek collection={peekCollection} peekId={id} rows={[row]} onPeekChange={() => {}} width={384} onWidthChange={() => {}} activeTab="fields" onActiveTabChange={() => {}} />
        </SidebarProvider>,
        { convex: t, config },
      );
      await waitFor(() => expect(within(container).getByRole("button", { name: "Close" })).toBeInTheDocument());
      return container.querySelector('[role="complementary"]') as HTMLElement;
    }

    it("offsets by --sidebar-width when the sidebar is on the RIGHT and expanded", async () => {
      const panel = await renderWithSidebar(
        defineConfig({ collections: [peekCollection], admin: { sidebar: { side: "right" } } }),
        true,
      );
      expect(panel.style.getPropertyValue("--peek-sidebar-offset")).toBe("var(--sidebar-width)");
    });

    it("offsets by --sidebar-width-icon when the sidebar is on the RIGHT, collapsed, and icon-collapsible", async () => {
      const panel = await renderWithSidebar(
        defineConfig({
          collections: [peekCollection],
          admin: { sidebar: { side: "right", collapsible: "icon" } },
        }),
        false,
      );
      expect(panel.style.getPropertyValue("--peek-sidebar-offset")).toBe("var(--sidebar-width-icon)");
    });

    it("never offsets when the sidebar is collapsed offcanvas (fully hidden, no layout space)", async () => {
      const panel = await renderWithSidebar(
        defineConfig({
          collections: [peekCollection],
          admin: { sidebar: { side: "right", collapsible: "offcanvas" } },
        }),
        false,
      );
      expect(panel.style.getPropertyValue("--peek-sidebar-offset")).toBe("0px");
    });

    it("never offsets when the sidebar is on the LEFT, regardless of state", async () => {
      const panel = await renderWithSidebar(
        defineConfig({ collections: [peekCollection], admin: { sidebar: { side: "left" } } }),
        true,
      );
      expect(panel.style.getPropertyValue("--peek-sidebar-offset")).toBe("0px");
    });
  });
});
