import { createElement } from "react";
import { fireEvent, waitFor } from "@testing-library/react";
import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineAccess } from "@vexcms/core";
import type * as ConvexReactQuery from "@convex-dev/react-query";
import { CollectionEditView } from "./CollectionEditView";
import { renderView } from "../../testing/harness/viewHarness";
import { testCollection } from "../../testing/harness/accessFixtures";
import schema, { testModules } from "../../testing/convex/schema";
import { runViewSuite } from "../../testing/viewSuite";

runViewSuite({ only: ["CollectionEditView"] });

const { convexMutationMock } = vi.hoisted(() => ({ convexMutationMock: vi.fn() }));

vi.mock("@convex-dev/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof ConvexReactQuery>();
  return { ...actual, useConvexMutation: () => convexMutationMock };
});

describe("CollectionEditView — diff submit", () => {
  const t = convexTest(schema, testModules);

  beforeEach(() => {
    convexMutationMock.mockReset().mockResolvedValue("doc1");
  });

  it("submits only the changed field", async () => {
    const doc = await t.run((ctx) => ctx.db.insert("documents", { status: "b", title: "a" }));
    const stored = await t.run((ctx) => ctx.db.get(doc));
    const utils = renderView(
      createElement(CollectionEditView, { collection: testCollection, documentId: doc, initialData: stored }),
      { convex: t },
    );

    fireEvent.change(utils.container.querySelector("#title")!, { target: { value: "new title" } });
    fireEvent.submit(utils.container.querySelector("form")!);

    await waitFor(() => expect(convexMutationMock).toHaveBeenCalled());
    // `status` was never edited, so it is absent — this is what stops a save
    // from reverting another editor's concurrent change to it.
    expect(convexMutationMock.mock.calls[0]?.[0]?.data).toEqual({ title: "new title" });
  });

  it("does not submit at all when nothing changed", async () => {
    const doc = await t.run((ctx) => ctx.db.insert("documents", { status: "b", title: "a" }));
    const stored = await t.run((ctx) => ctx.db.get(doc));
    const utils = renderView(
      createElement(CollectionEditView, { collection: testCollection, documentId: doc, initialData: stored }),
      { convex: t },
    );

    fireEvent.submit(utils.container.querySelector("form")!);

    // Let the microtask queue drain, so a submit that WAS going to fire has
    // had its chance before asserting it never did.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(convexMutationMock).not.toHaveBeenCalled();
  });

  it("omits a read-denied field from the submitted payload", async () => {
    // No shared-suite equivalent: the shared kit never mocks `useConvexMutation`
    // (a real submit would hit the fake bridge, which has no "vex:update"
    // handler), so a payload assertion only works here, against this file's
    // own hoisted mock.
    const readGatedAccess = defineAccess({
      roles: ["gated"] as const,
      resources: [testCollection],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        gated: {
          posts: {
            read: () => ({ "*": false, title: true }),
            update: () => ({ "*": false, title: true }),
          },
        },
      },
    });
    const id = await t.run((ctx) =>
      ctx.db.insert("documents", { status: "secret", title: "visible" }),
    );
    const stored = await t.run((ctx) => ctx.db.get(id));
    const utils = renderView(
      createElement(CollectionEditView, { collection: testCollection, documentId: id, initialData: stored }),
      { convex: t, access: readGatedAccess, auth: { user: { _id: "u1", roles: "gated" } as never } },
    );

    fireEvent.change(utils.container.querySelector("#title")!, { target: { value: "edited" } });
    fireEvent.submit(utils.container.querySelector("form")!);

    await waitFor(() => expect(convexMutationMock).toHaveBeenCalled());
    expect(convexMutationMock.mock.calls[0]?.[0]?.data).toEqual({ title: "edited" });
  });
});
