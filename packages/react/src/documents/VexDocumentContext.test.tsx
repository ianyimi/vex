import { describe, expect, it } from "vitest";
import { render, renderHook } from "@testing-library/react";
import { VexDocumentProvider, useVexDocument } from "./VexDocumentContext";
import type { VexDocumentState } from "./VexDocumentContext";

const baseState: VexDocumentState = {
  kind: "collection",
  slug: "posts",
  id: "doc1",
  saved: { title: "Hello" },
  isDirty: false,
  status: "draft",
  canEdit: true,
};

describe("useVexDocument", () => {
  it("returns the provided document state", () => {
    const { result } = renderHook(() => useVexDocument(), {
      wrapper: ({ children }) => (
        <VexDocumentProvider value={baseState}>{children}</VexDocumentProvider>
      ),
    });
    expect(result.current).toEqual(baseState);
  });

  it("throws outside a VexDocumentProvider", () => {
    const Consumer = () => {
      useVexDocument();
      return null;
    };
    expect(() => render(<Consumer />)).toThrow(
      "useVexDocument() must be used within a VexDocumentProvider.",
    );
  });

  it("omits id and status for a global, and reflects isDirty/canEdit", () => {
    const globalState: VexDocumentState = {
      kind: "global",
      slug: "siteSettings",
      saved: { title: "Site" },
      isDirty: true,
      canEdit: false,
    };
    const { result } = renderHook(() => useVexDocument(), {
      wrapper: ({ children }) => (
        <VexDocumentProvider value={globalState}>{children}</VexDocumentProvider>
      ),
    });
    expect(result.current.id).toBeUndefined();
    expect(result.current.status).toBeUndefined();
    expect(result.current.isDirty).toBe(true);
    expect(result.current.canEdit).toBe(false);
  });
});
