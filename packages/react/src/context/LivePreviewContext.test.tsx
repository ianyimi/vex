import { setTimeout as sleep } from "node:timers/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import {
  defineCollection,
  LIVE_PREVIEW_COOKIE,
  LIVE_PREVIEW_QUERY_PARAM,
  text,
  type CollectionSlug,
} from "@vexcms/core";
import { LIVE_PREVIEW_MESSAGE_SOURCE } from "./livePreviewProtocol";
import { LivePreviewProvider, useLivePreview } from "./LivePreviewContext";

/**
 * The indicator only renders when the provider decided preview mode is on, so
 * its presence is the observable proof of the gate's verdict.
 */
function renderProvider() {
  render(
    <LivePreviewProvider allowedOrigins={[]} collections={[]}>
      <p>page body</p>
    </LivePreviewProvider>,
  );
}

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

describe("LivePreviewProvider gate", () => {
  it("stays off with the query param alone — an unverified visitor gets no listener", async () => {
    setSearch(`${LIVE_PREVIEW_QUERY_PARAM}=1`);
    renderProvider();
    expect(await screen.findByText("page body")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Preview" })).not.toBeInTheDocument();
  });

  it("stays off with the verified cookie but no query param", async () => {
    setPreviewCookie("1");
    renderProvider();
    expect(await screen.findByText("page body")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Preview" })).not.toBeInTheDocument();
  });

  it("turns on only when both the query param and the verified cookie are present", async () => {
    setSearch(`${LIVE_PREVIEW_QUERY_PARAM}=1`);
    setPreviewCookie("1");
    renderProvider();
    expect(await screen.findByRole("button", { name: "Preview" })).toBeInTheDocument();
    expect(screen.getByText("page body")).toBeInTheDocument();
  });

  it("stays off when the marker cookie holds anything other than the verified value", async () => {
    setSearch(`${LIVE_PREVIEW_QUERY_PARAM}=1`);
    setPreviewCookie("0");
    renderProvider();
    expect(await screen.findByText("page body")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Preview" })).not.toBeInTheDocument();
  });
});

const previewCollection = defineCollection({
  slug: "pages" as CollectionSlug,
  fields: {
    title: text({ label: "Title" }),
    subtitle: text({ label: "Subtitle" }),
  },
});

/** Renders a consumer of the overlay so the map's effect on a document is observable. */
function PreviewedDocument(props: { doc: Record<string, unknown> }) {
  const previewed = useLivePreview(
    props.doc as never,
    "pages" as CollectionSlug,
  ) as unknown as Record<string, unknown>;
  return (
    <dl>
      <dd>title: {String(previewed?.title ?? "")}</dd>
      <dd>subtitle: {String(previewed?.subtitle ?? "")}</dd>
    </dl>
  );
}

function renderOverlay(doc: Record<string, unknown>) {
  render(
    <LivePreviewProvider allowedOrigins={[]} collections={[previewCollection]}>
      <PreviewedDocument doc={doc} />
    </LivePreviewProvider>,
  );
}

function broadcastUpdate(values: Record<string, unknown>, documentId: string) {
  const channel = new BroadcastChannel("vexcms-live-preview");
  channel.postMessage({
    source: LIVE_PREVIEW_MESSAGE_SOURCE,
    type: "vex-live-preview-update",
    collectionSlug: "pages",
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
