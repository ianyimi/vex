import { describe, expect, it } from "vitest";
import {
  resolveLivePreviewPanelMinSize,
  livePreviewLayoutCookieName,
  livePreviewPanelCookieName,
  readLivePreviewLayoutCookie,
  readLivePreviewPanelCookie,
} from "./panelCookie";

describe("readLivePreviewPanelCookie", () => {
  it("returns true for an explicit '1', regardless of defaultOpen", () => {
    expect(readLivePreviewPanelCookie({ cookieValue: "1", defaultOpen: false })).toBe(true);
  });

  it("returns false for an explicit '0', regardless of defaultOpen", () => {
    expect(readLivePreviewPanelCookie({ cookieValue: "0", defaultOpen: true })).toBe(false);
  });

  it("falls back to defaultOpen when no cookie has been written yet", () => {
    expect(readLivePreviewPanelCookie({ cookieValue: undefined, defaultOpen: true })).toBe(true);
    expect(readLivePreviewPanelCookie({ cookieValue: undefined, defaultOpen: false })).toBe(false);
  });

  it("falls back to defaultOpen for a garbage cookie value", () => {
    expect(readLivePreviewPanelCookie({ cookieValue: "true", defaultOpen: true })).toBe(true);
  });
});

describe("livePreviewPanelCookieName", () => {
  it("scopes the cookie per collection or global slug", () => {
    expect(livePreviewPanelCookieName({ slug: "pages" })).toBe("vex-live-preview-panel:pages");
  });
});

describe("readLivePreviewLayoutCookie", () => {
  it("returns the stored form-panel share", () => {
    expect(readLivePreviewLayoutCookie({ cookieValue: "42" })).toBe(42);
  });

  it("falls back to the default when unset or non-numeric", () => {
    expect(readLivePreviewLayoutCookie({ cookieValue: undefined })).toBe(60);
    expect(readLivePreviewLayoutCookie({ cookieValue: "wide" })).toBe(60);
  });

  it("clamps to the absolute floor, not the current split's derived floor", () => {
    // 10/90 is the hard limit. Clamping to a narrow window's derived floor
    // would permanently rewrite a wide-display layout the first time that
    // editor opened the document small.
    expect(readLivePreviewLayoutCookie({ cookieValue: "5" })).toBe(10);
    expect(readLivePreviewLayoutCookie({ cookieValue: "99" })).toBe(90);
  });
});

describe("livePreviewLayoutCookieName", () => {
  it("scopes the cookie per collection or global slug", () => {
    expect(livePreviewLayoutCookieName({ slug: "pages" })).toBe("vex-live-preview-layout:pages");
  });
});

describe("resolveLivePreviewPanelMinSize", () => {
  // `splitWidth` is the width the two columns actually divide — the viewport
  // minus the sidebar and the shell's gutters — not the window width.
  it("converts the form column's pixel floor into a share of that width", () => {
    expect(resolveLivePreviewPanelMinSize({ splitWidth: 2000 })).toBe(28);
    expect(resolveLivePreviewPanelMinSize({ splitWidth: 2560 })).toBe(22);
    expect(resolveLivePreviewPanelMinSize({ splitWidth: 3840 })).toBe(15);
  });

  it("holds the preview to a larger share than the form", () => {
    // A squeezed preview stops representing the page; a narrow form reflows.
    expect(resolveLivePreviewPanelMinSize({ splitWidth: 2000, column: "preview" })).toBe(36);
    expect(resolveLivePreviewPanelMinSize({ splitWidth: 2560, column: "preview" })).toBe(28);
    expect(resolveLivePreviewPanelMinSize({ splitWidth: 3840, column: "preview" })).toBe(19);
  });

  it("caps a laptop-sized split at 35% form / 50% preview", () => {
    // 1184 is a 1440px laptop with the sidebar open. Both pixel floors exceed
    // their caps there, so the caps govern — and 35 + 50 leaves fifteen points
    // of travel, the tightest the pair may ever get.
    expect(resolveLivePreviewPanelMinSize({ splitWidth: 1184 })).toBe(35);
    expect(resolveLivePreviewPanelMinSize({ splitWidth: 1184, column: "preview" })).toBe(50);
    expect(resolveLivePreviewPanelMinSize({ splitWidth: 800 })).toBe(35);
    expect(resolveLivePreviewPanelMinSize({ splitWidth: 800, column: "preview" })).toBe(50);
  });

  it("falls back to the absolute floor before the split has been measured", () => {
    expect(resolveLivePreviewPanelMinSize({ splitWidth: 0 })).toBe(10);
    expect(resolveLivePreviewPanelMinSize({ splitWidth: Number.NaN })).toBe(10);
  });
});
