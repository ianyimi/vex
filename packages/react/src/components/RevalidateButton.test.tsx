import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CRUD_ACTIONS, PERMISSION_SCOPES } from "@vexcms/core";

import { RevalidateButton } from "./RevalidateButton";

const { purgeCollectionMock, purgeDocumentMock, usePermissionMock, useVexRevalidateMock } =
  vi.hoisted(() => ({
    purgeCollectionMock: vi.fn(),
    purgeDocumentMock: vi.fn(),
    usePermissionMock: vi.fn(),
    useVexRevalidateMock: vi.fn(),
  }));

vi.mock("../hooks", () => ({ usePermission: usePermissionMock }));
vi.mock("../hooks/useVexRevalidate", () => ({ useVexRevalidate: useVexRevalidateMock }));

const doc = { _creationTime: 1, _id: "d1", slug: "roadmap" };

function defaultRevalidateState() {
  return {
    error: null,
    isPending: false,
    purgeCollection: purgeCollectionMock,
    purgeDocument: purgeDocumentMock,
  };
}

beforeEach(() => {
  usePermissionMock.mockReset().mockReturnValue(true);
  purgeDocumentMock.mockReset().mockResolvedValue({ errors: [], revalidated: ["/roadmap"] });
  purgeCollectionMock
    .mockReset()
    .mockResolvedValue({ errors: [], revalidated: ["/features", "/roadmap"] });
  useVexRevalidateMock.mockReset().mockReturnValue(defaultRevalidateState());
});

describe("RevalidateButton", () => {
  it("purges only the given document when `doc` is supplied", async () => {
    render(<RevalidateButton collection="pages" doc={doc} />);

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() =>
      expect(purgeDocumentMock).toHaveBeenCalledWith({ collection: "pages", doc }),
    );
    expect(purgeCollectionMock).not.toHaveBeenCalled();
  });

  it("purges the whole collection when `doc` is omitted", async () => {
    render(<RevalidateButton collection="pages" />);

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(purgeCollectionMock).toHaveBeenCalledWith({ collection: "pages" }));
    expect(purgeDocumentMock).not.toHaveBeenCalled();
  });

  it("labels the two modes differently so the blast radius is visible", () => {
    const { unmount } = render(<RevalidateButton collection="pages" doc={doc} />);
    expect(screen.getByRole("button").textContent).toContain("Revalidate");
    expect(screen.getByRole("button").textContent).not.toContain("all");
    unmount();

    render(<RevalidateButton collection="pages" />);
    expect(screen.getByRole("button").textContent).toContain("Revalidate all");
  });

  it("disables the button when the caller lacks write permission", () => {
    usePermissionMock.mockReturnValue(false);

    render(<RevalidateButton collection="pages" doc={doc} />);

    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
  });

  it("renders the button's pending affordance while a purge is in flight", () => {
    useVexRevalidateMock.mockReturnValue({ ...defaultRevalidateState(), isPending: true });

    render(<RevalidateButton collection="pages" doc={doc} />);

    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
  });

  it("surfaces the error message rather than failing silently", () => {
    useVexRevalidateMock.mockReturnValue({
      ...defaultRevalidateState(),
      error: new Error("Revalidate request failed: 403"),
    });

    render(<RevalidateButton collection="pages" doc={doc} />);

    expect(screen.queryByText("Revalidate request failed: 403")).not.toBeNull();
  });

  it("does not leave a failed purge as an unhandled rejection", async () => {
    purgeDocumentMock.mockRejectedValueOnce(new Error("Revalidate request failed: 403"));
    render(<RevalidateButton collection="pages" doc={doc} />);

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(purgeDocumentMock).toHaveBeenCalledTimes(1));
  });

  it("checks permission with scope 'any', so a role whose update check returns a field map still succeeds", () => {
    // Real `hasPermission` answers a quantified check (no `data`/`changes`)
    // with a field map under `scope: "any"` as `true` — the check that keeps
    // the button enabled instead of hidden the first time a role declares an
    // `update` field map. `usePermission` is mocked in this file, so the
    // regression is pinned by asserting the call shape rather than the
    // real resolution.
    render(<RevalidateButton collection="pages" doc={doc} />);

    expect(usePermissionMock).toHaveBeenCalledWith({
      action: CRUD_ACTIONS.update,
      resource: "pages",
      scope: PERMISSION_SCOPES.any,
    });
  });
});
