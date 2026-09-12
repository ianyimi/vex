import type { VexConfig, VexDocument, VexRevalidateChange, VexRouteMapper } from "@vexcms/core";
import type { VexRevalidateResponse } from "@vexcms/core";
import { defineAccess, defineCollection, text, VEX_REVALIDATE_BATCH_SIZE } from "@vexcms/core";
import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createVexRevalidateRoute } from "./createVexRevalidateRoute";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const pages = defineCollection({
  fields: { slug: text(), title: text({ required: true }) },
  slug: "pages",
});

const access = defineAccess({
  permissions: {
    editor: { pages: { create: true, delete: true, read: true, update: true } },
    fieldEditor: { pages: { update: () => ({ "*": false, title: true }) } },
    viewer: { pages: { read: true } },
  },
  resources: [pages],
  roles: ["editor", "fieldEditor", "viewer"] as const,
  userCollectionSlug: "users",
  userRolesField: "roles",
});

const editorUser = { _id: "u1", roles: "editor" };
const viewerUser = { _id: "u2", roles: "viewer" };
const fieldEditorUser = { _id: "u3", roles: "fieldEditor" };

/** Maps a doc's `slug` to `/pages/<slug>` — a stand-in for a project's route map. */
const map: VexRouteMapper = ({ collection, doc }) => [`/${collection}/${doc.slug as string}`];

/**
 * Builds a `VexConfig` carrying only what the route reads.
 *
 * @param overrides - Fields to replace on the base fixture.
 * @returns A config with `access` and a working `routes.map`.
 */
function makeConfig(overrides: Partial<VexConfig> = {}): VexConfig {
  return { access, routes: { map }, ...overrides } as VexConfig;
}

/**
 * Builds a POST request carrying `body` as JSON.
 *
 * @param body - The request payload.
 * @returns A `NextRequest` the handler can consume.
 */
function postRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/vex/revalidate", {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
}

/**
 * Builds a page document with the given slug.
 *
 * @param slug - The document's slug.
 * @returns A minimal document shaped like a real `pages` row.
 */
function page(slug: string): VexDocument {
  return { _creationTime: 1, _id: `d-${slug}`, slug } as unknown as VexDocument;
}

const signedInEditor = {
  getAuth: async () => ({ user: editorUser }),
  getToken: async () => "token",
};

beforeEach(() => {
  vi.mocked(revalidatePath).mockClear();
  vi.mocked(revalidatePath).mockImplementation(() => undefined);
});

describe("createVexRevalidateRoute", () => {
  it("returns 401 when there is no session token", async () => {
    const route = createVexRevalidateRoute({
      config: makeConfig(),
      getAuth: async () => ({ user: null }),
      getToken: async () => null,
    });

    const response = await route.POST(
      postRequest({ changes: [], collection: "pages", operation: "update" }),
    );

    expect(response.status).toBe(401);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns 403 when the session lacks write permission on the collection", async () => {
    const route = createVexRevalidateRoute({
      config: makeConfig(),
      getAuth: async () => ({ user: viewerUser }),
      getToken: async () => "token",
    });

    const response = await route.POST(
      postRequest({
        changes: [{ after: page("home") }],
        collection: "pages",
        operation: "update",
      }),
    );

    expect(response.status).toBe(403);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("purges when the update action resolves to a field map, since a purge writes no fields (scope: any)", async () => {
    const route = createVexRevalidateRoute({
      config: makeConfig(),
      getAuth: async () => ({ user: fieldEditorUser }),
      getToken: async () => "token",
    });

    const response = await route.POST(
      postRequest({
        changes: [{ after: page("home") }],
        collection: "pages",
        operation: "update",
      }),
    );
    const body = (await response.json()) as VexRevalidateResponse;

    expect(response.status).toBe(200);
    expect(body.revalidated).toEqual(["/pages/home"]);
  });

  it("purges both the pre-rename and post-rename path for one update", async () => {
    const route = createVexRevalidateRoute({ config: makeConfig(), ...signedInEditor });

    const response = await route.POST(
      postRequest({
        changes: [{ after: page("company"), before: page("about") }],
        collection: "pages",
        operation: "update",
      }),
    );
    const body = (await response.json()) as VexRevalidateResponse;

    expect(response.status).toBe(200);
    expect(body.revalidated).toEqual(["/pages/about", "/pages/company"]);
    expect(body.errors).toEqual([]);
    expect(vi.mocked(revalidatePath).mock.calls).toEqual([["/pages/about"], ["/pages/company"]]);
  });

  it("purges one path per row for a bulk remove", async () => {
    const route = createVexRevalidateRoute({ config: makeConfig(), ...signedInEditor });
    const changes: VexRevalidateChange[] = [
      { before: page("a") },
      { before: page("b") },
      { before: page("c") },
    ];

    const response = await route.POST(
      postRequest({ changes, collection: "pages", operation: "remove" }),
    );
    const body = (await response.json()) as VexRevalidateResponse;

    expect(response.status).toBe(200);
    expect(body.revalidated).toEqual(["/pages/a", "/pages/b", "/pages/c"]);
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledTimes(3);
  });

  it("dedupes paths across the batch", async () => {
    const route = createVexRevalidateRoute({ config: makeConfig(), ...signedInEditor });

    const response = await route.POST(
      postRequest({
        changes: [{ after: page("same") }, { after: page("same") }],
        collection: "pages",
        operation: "update",
      }),
    );
    const body = (await response.json()) as VexRevalidateResponse;

    expect(body.revalidated).toEqual(["/pages/same"]);
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledTimes(1);
  });

  it(`returns 413 past ${VEX_REVALIDATE_BATCH_SIZE} changes, before any map work`, async () => {
    const route = createVexRevalidateRoute({ config: makeConfig(), ...signedInEditor });
    const changes = Array.from({ length: VEX_REVALIDATE_BATCH_SIZE + 1 }, (_, i) => ({
      before: page(`p${i}`),
    }));

    const response = await route.POST(
      postRequest({ changes, collection: "pages", operation: "remove" }),
    );

    expect(response.status).toBe(413);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it(`accepts exactly ${VEX_REVALIDATE_BATCH_SIZE} changes`, async () => {
    const route = createVexRevalidateRoute({ config: makeConfig(), ...signedInEditor });
    const changes = Array.from({ length: VEX_REVALIDATE_BATCH_SIZE }, (_, i) => ({
      before: page(`p${i}`),
    }));

    const response = await route.POST(
      postRequest({ changes, collection: "pages", operation: "remove" }),
    );

    expect(response.status).toBe(200);
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledTimes(VEX_REVALIDATE_BATCH_SIZE);
  });

  it("an empty batch is not an error", async () => {
    const route = createVexRevalidateRoute({ config: makeConfig(), ...signedInEditor });

    const response = await route.POST(
      postRequest({ changes: [], collection: "pages", operation: "update" }),
    );
    const body = (await response.json()) as VexRevalidateResponse;

    expect(response.status).toBe(200);
    expect(body).toEqual({ errors: [], revalidated: [] });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("a throwing map returns 200 with the failure reported, not a 5xx", async () => {
    const boom = new Error("route map exploded");
    const throwingMap: VexRouteMapper = () => {
      throw boom;
    };
    const route = createVexRevalidateRoute({
      config: makeConfig({ routes: { map: throwingMap } }),
      ...signedInEditor,
    });

    const response = await route.POST(
      postRequest({
        changes: [{ after: page("home") }],
        collection: "pages",
        operation: "update",
      }),
    );
    const body = (await response.json()) as VexRevalidateResponse;

    expect(response.status).toBe(200);
    expect(body.revalidated).toEqual([]);
    expect(body.errors).toHaveLength(1);
  });

  it("no configured map still answers 200 rather than 500", async () => {
    const route = createVexRevalidateRoute({
      config: makeConfig({ routes: undefined }),
      ...signedInEditor,
    });

    const response = await route.POST(
      postRequest({
        changes: [{ after: page("home") }],
        collection: "pages",
        operation: "update",
      }),
    );

    expect(response.status).toBe(200);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("a failing revalidatePath is reported without failing the request", async () => {
    vi.mocked(revalidatePath).mockImplementation(() => {
      throw new Error("purge failed");
    });
    const route = createVexRevalidateRoute({ config: makeConfig(), ...signedInEditor });

    const response = await route.POST(
      postRequest({
        changes: [{ after: page("home") }],
        collection: "pages",
        operation: "update",
      }),
    );
    const body = (await response.json()) as VexRevalidateResponse;

    expect(response.status).toBe(200);
    expect(body.revalidated).toEqual([]);
    expect(body.errors).toHaveLength(1);
  });

  it("collection-wide purge maps every document listCollection returns", async () => {
    const route = createVexRevalidateRoute({
      config: makeConfig(),
      listCollection: async () => [page("a"), page("b")],
      ...signedInEditor,
    });

    const response = await route.POST(postRequest({ all: true, collection: "pages" }));
    const body = (await response.json()) as VexRevalidateResponse;

    expect(response.status).toBe(200);
    expect(body.revalidated).toEqual(["/pages/a", "/pages/b"]);
  });

  it("collection-wide purge reports when listCollection is not wired", async () => {
    const route = createVexRevalidateRoute({ config: makeConfig(), ...signedInEditor });

    const response = await route.POST(postRequest({ all: true, collection: "pages" }));
    const body = (await response.json()) as VexRevalidateResponse;

    expect(response.status).toBe(200);
    expect(body.revalidated).toEqual([]);
    expect(body.errors).toHaveLength(1);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("malformed JSON returns 400", async () => {
    const route = createVexRevalidateRoute({ config: makeConfig(), ...signedInEditor });
    const request = new NextRequest("http://localhost/api/vex/revalidate", {
      body: "{not json",
      headers: { "content-type": "application/json" },
      method: "POST",
    });

    const response = await route.POST(request);

    expect(response.status).toBe(400);
  });
});
