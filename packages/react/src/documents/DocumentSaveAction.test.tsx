import "@testing-library/jest-dom/vitest";
import { createElement } from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { convexTest } from "convex-test";
import { afterEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import { CollectionEditView } from "../collections";
import { renderView, testClientConfig } from "../testing/harness/viewHarness";
import { testCollection } from "../testing/harness/accessFixtures";
import schema, { testModules } from "../testing/convex/schema";

/**
 * Regression coverage for the non-versioned save path's missing try/catch
 * (`DocumentSaveAction.tsx`'s `handleSave`). Before the fix, a rejected
 * `vexConvexApi.update` call propagated straight out of `handleSave` with no
 * catch — an unhandled promise rejection at the `onClick={() => void
 * handleSave()}` call site, and `runtime.onSaved` never ran. The fake convex
 * client (`testing/convex/bridge.ts`) registers no `"vex:update"` handler, so
 * clicking Save on a loaded, non-versioned `testCollection` document genuinely
 * rejects the mutation here — the same shape of failure a real `ConvexError`
 * (a unique-field conflict, an access denial) would produce in production.
 */
describe("DocumentSaveAction — non-versioned save failure", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a visible error and leaves no unhandled rejection when the update mutation rejects", async () => {
    const t = convexTest(schema, testModules);
    const id = await t.run((ctx) => ctx.db.insert("documents", { status: "draft" }));
    const stored = await t.run((ctx) => ctx.db.get(id));
    const toastErrorSpy = vi.spyOn(toast, "error");

    renderView(
      createElement(CollectionEditView, {
        collection: testCollection.slug,
        documentId: id,
        initialData: stored,
      }),
      { convex: t, config: testClientConfig },
    );

    const statusInput = await screen.findByLabelText(/status/i);
    fireEvent.change(statusInput, { target: { value: "published" } });

    const saveButton = await screen.findByRole("button", { name: "Save" });
    await waitFor(() => expect(saveButton).not.toBeDisabled());
    fireEvent.click(saveButton);

    // A vitest test that leaves an unhandled rejection in flight during its
    // own run fails the run — this `waitFor` settling (rather than the test
    // process reporting an unhandled rejection) is itself part of what this
    // test asserts.
    await waitFor(() => expect(toastErrorSpy).toHaveBeenCalledTimes(1));
    expect(toastErrorSpy).toHaveBeenCalledWith(
      "Request failed",
      expect.objectContaining({ description: expect.any(String) }),
    );
    // The form stays editable — isPending/isSubmitting settle back to false
    // on a rejection exactly like on success, so the user can retry.
    expect(saveButton).not.toBeDisabled();
  });
});
