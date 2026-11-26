import { render, screen, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useForm } from "@tanstack/react-form";
import { defineConfig, defineGlobal, text, vexConvexApi } from "@vexcms/core";
import { VersionPublishAction } from "./VersionPublishAction";
import { AppForm, type AnyFormApi } from "../forms";
import { VexConfigProvider } from "../config/VexConfigContext";
import { VexDocumentProvider, type VexDocumentState } from "../documents/VexDocumentContext";
import { DocumentEditRuntimeProvider, type DocumentEditRuntimeState } from "../documents/DocumentEditRuntimeContext";
import type { ViewedVersion } from "./VersionHistoryPanel";
import { testCollection } from "../testing/harness/accessFixtures";
import type * as ConvexReactQueryModule from "@convex-dev/react-query";
import type * as TanstackQueryModule from "@tanstack/react-query";

vi.mock("@convex-dev/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof ConvexReactQueryModule>();
  return {
    ...actual,
    convexQuery: (reference: unknown, args: unknown) => ({ __reference: reference, __args: args }),
    useConvexMutation: () => vi.fn(),
  };
});

/**
 * The mocked published-row results for the currently-rendering test, and every non-`"skip"`
 * args object each lookup was built with. `ConvexQueryClient` subscribes to every cached query
 * whose args aren't `"skip"`, even with `enabled: false`, so any recorded args here would reach
 * the server. Asserted per-test so a lookup by the draft's own id, or by an empty id, fails loudly.
 */
let publishedCollectionRow: Record<string, unknown> | null = null;
let publishedGlobalRow: Record<string, unknown> | null = null;
let collectionGetCalls: unknown[] = [];
let globalGetCalls: unknown[] = [];

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof TanstackQueryModule>();
  return {
    ...actual,
    useQuery: (options: { __reference?: unknown; __args?: unknown }) => {
      if (options.__reference === vexConvexApi.get) {
        if (options.__args === "skip") return { data: undefined };
        const args = options.__args;
        collectionGetCalls.push(args && typeof args === "object" && "id" in args ? args.id : args);
        return { data: publishedCollectionRow };
      }
      if (options.__reference === vexConvexApi.globals.get) {
        if (options.__args === "skip") return { data: undefined };
        globalGetCalls.push(options.__args);
        return { data: publishedGlobalRow };
      }
      return { data: undefined };
    },
    useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  };
});

const versionedCollection = {
  ...testCollection,
  versions: { ...testCollection.versions, drafts: true },
} as unknown as typeof testCollection;

const versionedGlobal = defineGlobal({
  slug: "settings",
  label: "Settings",
  fields: { tagline: text({ required: false }) },
  versions: { drafts: true },
});

const config = defineConfig({
  collections: [versionedCollection],
  globals: [versionedGlobal],
});

const PUBLISHED_ROW_ID = "published-row-id";

function draftDocumentState(saved: Record<string, unknown>): VexDocumentState {
  return {
    kind: "collection",
    slug: versionedCollection.slug,
    id: "draft-row-id", // the DRAFT row's own id — must never reach the published-row query
    saved,
    isDirty: false,
    status: "draft",
    canEdit: true,
  };
}

function globalDocumentState(saved: Record<string, unknown> | undefined): VexDocumentState {
  return {
    kind: "global",
    slug: versionedGlobal.slug,
    saved,
    isDirty: false,
    status: "draft",
    canEdit: true,
  };
}

/**
 * Mounts `VersionPublishAction` the way `CollectionEditView`/`GlobalEditView` do: inside
 * `VexConfigProvider` + `VexDocumentProvider` + `DocumentEditRuntimeProvider` + a real
 * `<AppForm>`, so `useVexForm()`/`useStore(form.store, ...)` read a genuine TanStack form
 * instance instead of a mock.
 */
function renderPublish(props: {
  kind: "collection" | "global";
  document: VexDocumentState;
  defaultValues: Record<string, unknown>;
  edit?: readonly [string, unknown];
  viewedVersion?: ViewedVersion | null;
}) {
  const formRef: { current: AnyFormApi | undefined } = { current: undefined };
  const runtimeState: DocumentEditRuntimeState = {
    viewedVersion: props.viewedVersion ?? null,
    onViewVersion: vi.fn(),
    onSaved: vi.fn(),
  };

  function Harness() {
    const form = useForm({ defaultValues: props.defaultValues }) as unknown as AnyFormApi;
    formRef.current = form;
    return (
      <VexConfigProvider config={config}>
        <VexDocumentProvider value={props.document}>
          <DocumentEditRuntimeProvider value={runtimeState}>
            <AppForm form={form}>
              <VersionPublishAction
                kind={props.kind}
                slug={props.kind === "collection" ? versionedCollection.slug : versionedGlobal.slug}
              />
            </AppForm>
          </DocumentEditRuntimeProvider>
        </VexDocumentProvider>
      </VexConfigProvider>
    );
  }

  render(<Harness />);
  if (props.edit) {
    act(() => {
      formRef.current!.setFieldValue(props.edit![0], props.edit![1]);
    });
  }
}

describe("VersionPublishAction", () => {
  beforeEach(() => {
    publishedCollectionRow = null;
    publishedGlobalRow = null;
    collectionGetCalls = [];
    globalGetCalls = [];
  });

  it("disables Publish for a never-published collection draft with no edits, skipping the published-row query entirely", async () => {
    renderPublish({
      kind: "collection",
      document: draftDocumentState({ status: "", title: "" }), // no vex_publishedId pointer
      defaultValues: { status: "", title: "" },
    });

    const button = await screen.findByRole("button", { name: "Publish" });
    expect(button).toBeDisabled();
    expect(collectionGetCalls).toEqual([]);
    expect(globalGetCalls).toEqual([]);
  });

  it("still enables Publish for a never-published collection draft WITH edits", async () => {
    renderPublish({
      kind: "collection",
      document: draftDocumentState({ status: "", title: "" }),
      defaultValues: { status: "", title: "" },
      edit: ["title", "Launch post"],
    });

    const button = await screen.findByRole("button", { name: "Publish" });
    expect(button).not.toBeDisabled();
  });

  it("enables Publish for a saved draft that differs from published, no further edits — queries the published row by vex_publishedId, never document.id", async () => {
    publishedCollectionRow = { status: "published", title: "Old title" };
    const draftSaved = { status: "", title: "", vex_publishedId: PUBLISHED_ROW_ID };
    renderPublish({
      kind: "collection",
      document: draftDocumentState(draftSaved),
      defaultValues: { status: "", title: "" }, // matches the draft's own saved values — no edits
    });

    const button = await screen.findByRole("button", { name: "Publish" });
    expect(button).not.toBeDisabled();
    expect(collectionGetCalls).toEqual([PUBLISHED_ROW_ID]);
    expect(collectionGetCalls).not.toContain("draft-row-id");
  });

  it("disables Publish while viewing the already-published version from history, no edits", async () => {
    // `testCollection` auto-injects an `updatedAt: commitTs()` field (defineCollection's
    // timestamp injection) — included on both sides so it doesn't itself break the equality
    // check `matchesPublished` relies on.
    publishedCollectionRow = { status: "published", title: "Published title", updatedAt: 1 };
    const draftSaved = { status: "", title: "", vex_publishedId: PUBLISHED_ROW_ID };
    renderPublish({
      kind: "collection",
      document: draftDocumentState(draftSaved),
      // The edit view swaps the form's `document` to the viewed snapshot (`CollectionEditView.tsx`'s
      // `formDocument`) and resets — the form's values become the snapshot's content.
      defaultValues: { status: "published", title: "Published title", updatedAt: 1 },
      viewedVersion: {
        version: 2,
        snapshot: { status: "published", title: "Published title", updatedAt: 1 },
      },
    });

    const button = await screen.findByRole("button", { name: "Publish" });
    expect(button).toBeDisabled();
  });

  it("enables Publish while viewing an older version that differs from published", async () => {
    publishedCollectionRow = { status: "published", title: "Published title" };
    const draftSaved = { status: "", title: "", vex_publishedId: PUBLISHED_ROW_ID };
    renderPublish({
      kind: "collection",
      document: draftDocumentState(draftSaved),
      defaultValues: { status: "draft", title: "Older draft content" },
      viewedVersion: { version: 1, snapshot: { status: "draft", title: "Older draft content" } },
    });

    const button = await screen.findByRole("button", { name: "Publish" });
    expect(button).not.toBeDisabled();
  });

  it("renders nothing for a live published document with no edits — Unpublish shows instead", () => {
    renderPublish({
      kind: "collection",
      document: {
        kind: "collection",
        slug: versionedCollection.slug,
        id: "published-row-id",
        saved: { status: "published", title: "Live" },
        isDirty: false,
        status: "published",
        canEdit: true,
      },
      defaultValues: { status: "published", title: "Live" },
    });

    expect(screen.queryByRole("button", { name: "Publish" })).toBeNull();
  });

  it("globals: disables Publish for a never-saved global with no edits (regression guard, unaffected by the collection fix)", async () => {
    renderPublish({
      kind: "global",
      document: globalDocumentState(undefined), // no row at all yet
      defaultValues: { tagline: "Untitled" },
    });

    const button = await screen.findByRole("button", { name: "Publish" });
    expect(button).toBeDisabled();
  });

  it("globals: still enables Publish for a never-saved global WITH edits", async () => {
    renderPublish({
      kind: "global",
      document: globalDocumentState(undefined),
      defaultValues: { tagline: "Untitled" },
      edit: ["tagline", "New tagline"],
    });

    const button = await screen.findByRole("button", { name: "Publish" });
    expect(button).not.toBeDisabled();
  });
});
