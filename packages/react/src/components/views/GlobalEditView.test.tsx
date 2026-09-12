import { createElement } from "react";
import { fireEvent, waitFor } from "@testing-library/react";
import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineAccess, text, type GlobalConfig } from "@vexcms/core";
import type * as ConvexReactQuery from "@convex-dev/react-query";
import { GlobalEditView } from "./GlobalEditView";
import { renderView, testClientConfig } from "../../testing/harness/viewHarness";
import schema, { testModules } from "../../testing/convex/schema";
import { runViewSuite } from "../../testing/viewSuite";

runViewSuite({ only: ["GlobalEditView"] });

const { convexMutationMock } = vi.hoisted(() => ({ convexMutationMock: vi.fn() }));

vi.mock("@convex-dev/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof ConvexReactQuery>();
  return { ...actual, useConvexMutation: () => convexMutationMock };
});

describe("GlobalEditView — diff submit", () => {
  const t = convexTest(schema, testModules);

  beforeEach(() => {
    convexMutationMock.mockReset().mockResolvedValue("settings");
  });

  it("submits only the changed field once the global has been saved before", async () => {
    const stored = { _creationTime: 1, _id: "g1", siteName: "old name", tagline: "old tagline" };
    const utils = renderView(
      createElement(GlobalEditView, { global: testClientConfig.globals[0], initialData: stored as never }),
      { convex: t },
    );

    fireEvent.change(utils.container.querySelector("#siteName")!, { target: { value: "new name" } });
    fireEvent.submit(utils.container.querySelector("form")!);

    await waitFor(() => expect(convexMutationMock).toHaveBeenCalled());
    // `tagline` was never edited, so it is absent from the submitted diff.
    expect(convexMutationMock.mock.calls[0]?.[0]?.data).toEqual({ siteName: "new name" });
  });

  it("does not submit at all when nothing changed on an already-saved global", async () => {
    const stored = { _creationTime: 1, _id: "g1", siteName: "old name", tagline: "old tagline" };
    const utils = renderView(
      createElement(GlobalEditView, { global: testClientConfig.globals[0], initialData: stored as never }),
      { convex: t },
    );

    fireEvent.submit(utils.container.querySelector("form")!);

    // Let the microtask queue drain, so a submit that WAS going to fire has
    // had its chance before asserting it never did.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(convexMutationMock).not.toHaveBeenCalled();
  });

  it("submits the full payload before the global has ever been saved, so field defaults persist", async () => {
    // No `initialData` — `globalDoc` stays undefined (the real "never saved
    // yet" state), so `defaultValues` are the field defaults and nothing is
    // dirty. A diff here would send `{}` and `tagline`'s declared default
    // would never be written.
    const utils = renderView(createElement(GlobalEditView, { global: testClientConfig.globals[0] }), {
      convex: t,
    });

    fireEvent.change(utils.container.querySelector("#siteName")!, { target: { value: "new name" } });
    fireEvent.submit(utils.container.querySelector("form")!);

    await waitFor(() => expect(convexMutationMock).toHaveBeenCalled());
    expect(convexMutationMock.mock.calls[0]?.[0]?.data).toMatchObject({
      siteName: "new name",
      tagline: "Untitled",
    });
  });

  it("still submits when a read-denied field is required", async () => {
    // No shared-suite equivalent: the shared kit never mocks `useConvexMutation`
    // (a real submit would hit the fake bridge, which has no globals mutation
    // handler), so a payload assertion only works here, against this file's
    // own hoisted mock. A read-denied field is kept out of `defaultValues` AND
    // out of the validation schema, so a required one cannot block submission
    // with an error that has nowhere to render. The server validates the
    // merged stored document, so the omitted field is still required in the DB.
    const requiredSiteName = {
      ...testClientConfig.globals[0],
      fields: {
        siteName: text({ required: true }),
        tagline: text({ required: false, defaultValue: "Untitled" }),
      },
    } as unknown as GlobalConfig;
    const readGatedAccess = defineAccess({
      roles: ["gated"] as const,
      resources: [requiredSiteName as never],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        gated: {
          settings: {
            read: () => ({ "*": false, tagline: true }),
            update: () => ({ "*": false, tagline: true }),
          },
        },
      } as never,
    });
    const stored = { _creationTime: 1, _id: "g1", siteName: "secret", tagline: "visible" };

    const utils = renderView(
      createElement(GlobalEditView, { global: requiredSiteName, initialData: stored as never }),
      {
        convex: t,
        config: { ...testClientConfig, globals: [requiredSiteName] } as never,
        access: readGatedAccess,
        auth: { user: { _id: "u1", roles: "gated" } as never },
      },
    );

    fireEvent.change(utils.container.querySelector("#tagline")!, { target: { value: "new" } });
    fireEvent.submit(utils.container.querySelector("form")!);

    await waitFor(() => expect(convexMutationMock).toHaveBeenCalled());
    expect(convexMutationMock.mock.calls[0]?.[0]?.data).toEqual({ tagline: "new" });
  });
});
