import { setTimeout as sleep } from "node:timers/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import {
  defineCollection,
  defineGlobal,
  LIVE_PREVIEW_COOKIE,
  LIVE_PREVIEW_QUERY_PARAM,
  text,
  type CollectionSlug,
  type VexClientConfig,
  type VexResourceSlug,
} from "@vexcms/core";
import { LIVE_PREVIEW_MESSAGE_SOURCE } from "./livePreviewProtocol";
import { LivePreviewProvider, useLivePreview } from "./LivePreviewContext";
import { VexConfigProvider } from "./VexConfigContext";

function setPreviewCookie(value: "1" | "0") {
  document.cookie = `${LIVE_PREVIEW_COOKIE}=${value}; path=/`;
}

function clearPreviewCookie() {
  document.cookie = `${LIVE_PREVIEW_COOKIE}=; path=/; max-age=0`;
}

function setSearch(search: string) {
  window.history.replaceState({}, "", search === "" ? "/" : `/?${search}`);
}

afterEach(() => {
  clearPreviewCookie();
  setSearch("");
});

const previewCollection = defineCollection({
  slug: "pages" as CollectionSlug,
  fields: {
    title: text({ label: "Title" }),
    subtitle: text({ label: "Subtitle" }),
  },
});

const previewGlobal = defineGlobal({
  slug: "siteSettings",
  label: "Site Settings",
  fields: {
    title: text({ label: "Title" }),
    subtitle: text({ label: "Subtitle" }),
  },
});

/**
 * The provider now reads collections, globals, and `allowedOrigins` from
 * `VexConfigContext`, so the tests supply exactly that — no prop stand-ins.
 */
const previewConfig = {
  admin: { livePreview: { allowedOrigins: [] } },
  collections: [previewCollection],
  globals: [previewGlobal],
} as unknown as VexClientConfig;

/** Renders a consumer of the overlay so the map's effect on a document is observable. */
function PreviewedDocument(props: { doc: Record<string, unknown>; slug?: string }) {
  const previewed = useLivePreview(
    props.doc as never,
    (props.slug ?? "pages") as VexResourceSlug,
  ) as unknown as Record<string, unknown>;
  return (
    <dl>
      <dd>title: {String(previewed?.title ?? "")}</dd>
      <dd>subtitle: {String(previewed?.subtitle ?? "")}</dd>
    </dl>
  );
}

function renderOverlay(doc: Record<string, unknown>, slug?: string) {
  render(
    <VexConfigProvider config={previewConfig}>
      <LivePreviewProvider>
        <PreviewedDocument doc={doc} slug={slug} />
      </LivePreviewProvider>
    </VexConfigProvider>,
  );
}

function broadcastUpdate(
  values: Record<string, unknown>,
  documentId: string,
  collectionSlug = "pages",
) {
  const channel = new BroadcastChannel("vexcms-live-preview");
  channel.postMessage({
    source: LIVE_PREVIEW_MESSAGE_SOURCE,
    type: "vex-live-preview-update",
    collectionSlug,
    documentId,
    values,
  });
  channel.close();
}

describe("LivePreviewProvider overlay", () => {
  beforeEach(() => {
    setSearch(`${LIVE_PREVIEW_QUERY_PARAM}=1`);
    setPreviewCookie("1");
  });

  it("overlays the sent field onto the fetched document", async () => {
    renderOverlay({ _id: "doc1", title: "Saved title", subtitle: "Saved subtitle" });
    await screen.findByText(/title: Saved title/);

    await act(async () => {
      broadcastUpdate({ title: "Unsaved title" }, "doc1");
      await sleep(10);
    });

    expect(await screen.findByText(/title: Unsaved title/)).toBeInTheDocument();
  });

  it("leaves fields the update never carried untouched", async () => {
    // Regression: `.partial()` still applies each field's default, so parsing an
    // update that carried only `title` used to yield a full object that blanked
    // every other field on the previewed document.
    renderOverlay({ _id: "doc1", title: "Saved title", subtitle: "Saved subtitle" });
    await screen.findByText(/subtitle: Saved subtitle/);

    await act(async () => {
      broadcastUpdate({ title: "Unsaved title" }, "doc1");
      await sleep(10);
    });

    await screen.findByText(/title: Unsaved title/);
    expect(screen.getByText(/subtitle: Saved subtitle/)).toBeInTheDocument();
  });

  it("overlays a global's update, which is addressed by slug rather than by id", async () => {
    // Regression: `GlobalEditView` sends the global's slug as `documentId`
    // (one document per global, its `_id` is an implementation detail), while
    // the consumer keyed the lookup by `doc._id`. The two never met, so no
    // global — `siteSettings` and therefore the site theme included — ever
    // updated in preview.
    renderOverlay(
      { _id: "m17925xyz", _slug: "siteSettings", title: "Saved title", subtitle: "Saved subtitle" },
      "siteSettings",
    );
    await screen.findByText(/title: Saved title/);

    await act(async () => {
      broadcastUpdate({ title: "Unsaved title" }, "siteSettings", "siteSettings");
      await sleep(10);
    });

    expect(await screen.findByText(/title: Unsaved title/)).toBeInTheDocument();
  });

  it("ignores an update addressed to a different document", async () => {
    renderOverlay({ _id: "doc1", title: "Saved title", subtitle: "Saved subtitle" });
    await screen.findByText(/title: Saved title/);

    await act(async () => {
      broadcastUpdate({ title: "Someone else's edit" }, "doc2");
      await sleep(10);
    });

    expect(screen.getByText(/title: Saved title/)).toBeInTheDocument();
  });
});

describe("LivePreviewProvider gate", () => {
  /**
   * Whether an update reaches the overlay IS the gate's verdict — the provider
   * renders no affordance of its own, so there is nothing else to observe.
   */
  async function overlayReceivesUpdate(): Promise<boolean> {
    renderOverlay({ _id: "doc1", title: "Saved title", subtitle: "Saved subtitle" });
    await screen.findByText(/title: Saved title/);

    await act(async () => {
      broadcastUpdate({ title: "Unsaved title" }, "doc1");
      await sleep(10);
    });

    return screen.queryByText(/title: Unsaved title/) !== null;
  }

  it("stays off with the query param alone — an unverified visitor gets no listener", async () => {
    setSearch(`${LIVE_PREVIEW_QUERY_PARAM}=1`);
    expect(await overlayReceivesUpdate()).toBe(false);
  });

  it("stays off with the verified cookie but no query param", async () => {
    setPreviewCookie("1");
    expect(await overlayReceivesUpdate()).toBe(false);
  });

  it("turns on only when both the query param and the verified cookie are present", async () => {
    setSearch(`${LIVE_PREVIEW_QUERY_PARAM}=1`);
    setPreviewCookie("1");
    expect(await overlayReceivesUpdate()).toBe(true);
  });

  it("stays off when the marker cookie holds anything other than the verified value", async () => {
    setSearch(`${LIVE_PREVIEW_QUERY_PARAM}=1`);
    setPreviewCookie("0");
    expect(await overlayReceivesUpdate()).toBe(false);
  });
});
