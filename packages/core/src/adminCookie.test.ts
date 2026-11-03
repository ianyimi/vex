import { describe, expect, it } from "vitest";
import {
  ADMIN_COOKIE_LOCAL_VIEW_NAME_MAX_CHARS,
  ADMIN_COOKIE_MAX_BYTES,
  ADMIN_COOKIE_NAME,
  adminCollectionCookieName,
  parseAdminCollectionCookie,
  parseAdminCookie,
  serializeAdminCollectionCookie,
  serializeAdminCookie,
  truncateLocalViewName,
} from "./adminCookie";

// `truncateLocalViewName` is the ONE function both the cookie write side
// (`serializeAdminCollectionCookie`, tested indirectly below) and
// `@vexcms/react`'s local-view TAB LABEL render (`SavedListViewTabs.tsx`,
// developer-reported zero-shift fix) call — a direct unit test here, on
// top of the indirect `serializeAdminCollectionCookie` coverage below,
// pins its own standalone contract now that a second package depends on
// it directly.
describe("truncateLocalViewName", () => {
  it("returns a short name unchanged", () => {
    expect(truncateLocalViewName("Published")).toBe("Published");
  });

  it(`leaves a name at exactly ${ADMIN_COOKIE_LOCAL_VIEW_NAME_MAX_CHARS} chars unchanged`, () => {
    const exact = "x".repeat(ADMIN_COOKIE_LOCAL_VIEW_NAME_MAX_CHARS);
    expect(truncateLocalViewName(exact)).toBe(exact);
  });

  it(`truncates a name past ${ADMIN_COOKIE_LOCAL_VIEW_NAME_MAX_CHARS} chars to exactly that many code points`, () => {
    const longName = "With body and a very long descriptive view name past the limit";
    const truncated = truncateLocalViewName(longName);
    expect([...truncated]).toHaveLength(ADMIN_COOKIE_LOCAL_VIEW_NAME_MAX_CHARS);
    expect(truncated).toBe([...longName].slice(0, ADMIN_COOKIE_LOCAL_VIEW_NAME_MAX_CHARS).join(""));
  });

  it("never splits a surrogate pair", () => {
    const longEmojiName = "🎉".repeat(ADMIN_COOKIE_LOCAL_VIEW_NAME_MAX_CHARS + 5);
    const truncated = truncateLocalViewName(longEmojiName);
    expect([...truncated]).toHaveLength(ADMIN_COOKIE_LOCAL_VIEW_NAME_MAX_CHARS);
    expect(JSON.stringify(truncated)).not.toMatch(/\\u[dD][89abAB][0-9a-fA-F]{2}(?!\\u)/);
  });
});

describe("ADMIN_COOKIE_NAME / adminCollectionCookieName", () => {
  it("names the global cookie vex-admin", () => {
    expect(ADMIN_COOKIE_NAME).toBe("vex-admin");
  });

  it("scopes the collection cookie as vex-admin:<collection>", () => {
    expect(adminCollectionCookieName({ collection: "posts" })).toBe("vex-admin:posts");
  });
});

describe("parseAdminCookie", () => {
  it("degrades to all-defaults when unset", () => {
    expect(parseAdminCookie({ cookieValue: undefined })).toEqual({ v: 1 });
  });

  it("degrades to all-defaults on malformed JSON", () => {
    expect(parseAdminCookie({ cookieValue: "{not json" })).toEqual({ v: 1 });
  });

  it("degrades to all-defaults on a non-object value", () => {
    expect(parseAdminCookie({ cookieValue: encodeURIComponent(JSON.stringify([1, 2])) })).toEqual({ v: 1 });
  });

  it("degrades to all-defaults on a missing/mismatched version", () => {
    expect(parseAdminCookie({ cookieValue: encodeURIComponent(JSON.stringify({ density: "compact" })) })).toEqual({
      v: 1,
    });
    expect(
      parseAdminCookie({ cookieValue: encodeURIComponent(JSON.stringify({ v: 2, density: "compact" })) }),
    ).toEqual({ v: 1 });
  });

  it("parses density, dropping an invalid value", () => {
    expect(
      parseAdminCookie({ cookieValue: encodeURIComponent(JSON.stringify({ v: 1, density: "compact" })) }),
    ).toEqual({ v: 1, density: "compact" });
    expect(
      parseAdminCookie({ cookieValue: encodeURIComponent(JSON.stringify({ v: 1, density: "huge" })) }),
    ).toEqual({ v: 1 });
  });

  it("parses sidebarOpen, dropping a non-boolean value", () => {
    expect(
      parseAdminCookie({ cookieValue: encodeURIComponent(JSON.stringify({ v: 1, sidebarOpen: false })) }),
    ).toEqual({ v: 1, sidebarOpen: false });
    expect(
      parseAdminCookie({ cookieValue: encodeURIComponent(JSON.stringify({ v: 1, sidebarOpen: "false" })) }),
    ).toEqual({ v: 1 });
  });

  it("parses peekTab, dropping an invalid value", () => {
    expect(
      parseAdminCookie({ cookieValue: encodeURIComponent(JSON.stringify({ v: 1, peekTab: "json" })) }),
    ).toEqual({ v: 1, peekTab: "json" });
    expect(
      parseAdminCookie({ cookieValue: encodeURIComponent(JSON.stringify({ v: 1, peekTab: "notes" })) }),
    ).toEqual({ v: 1 });
  });

  it("parses livePreview, dropping unknown/invalid fields but keeping valid ones", () => {
    expect(
      parseAdminCookie({
        cookieValue: encodeURIComponent(JSON.stringify({ v: 1, livePreview: { panelOpen: true, panelSize: 42 } })),
      }),
    ).toEqual({ v: 1, livePreview: { panelOpen: true, panelSize: 42 } });
    expect(
      parseAdminCookie({
        cookieValue: encodeURIComponent(JSON.stringify({ v: 1, livePreview: { panelOpen: "yes" } })),
      }),
    ).toEqual({ v: 1 });
  });
});

describe("parseAdminCollectionCookie", () => {
  it("degrades to all-defaults when unset or malformed", () => {
    expect(parseAdminCollectionCookie({ cookieValue: undefined })).toEqual({ v: 1 });
    expect(parseAdminCollectionCookie({ cookieValue: "{not json" })).toEqual({ v: 1 });
  });

  it("parses chipsVisible", () => {
    expect(
      parseAdminCollectionCookie({
        cookieValue: encodeURIComponent(JSON.stringify({ v: 1, chipsVisible: false })),
      }),
    ).toEqual({ v: 1, chipsVisible: false });
  });

  it("parses peekWidth", () => {
    expect(
      parseAdminCollectionCookie({
        cookieValue: encodeURIComponent(JSON.stringify({ v: 1, peekWidth: 520 })),
      }),
    ).toEqual({ v: 1, peekWidth: 520 });
  });

  it("parses localViews, dropping malformed entries", () => {
    const result = parseAdminCollectionCookie({
      cookieValue: encodeURIComponent(
        JSON.stringify({
          v: 1,
          localViews: [{ viewId: "v1", name: "Tab" }, { viewId: "v2" }, "garbage", null],
        }),
      ),
    });
    expect(result).toEqual({ v: 1, localViews: [{ viewId: "v1", name: "Tab" }] });
  });

  it("parses rowCounts, dropping malformed entries (including the pre-footer-tracking bare-number shape)", () => {
    const result = parseAdminCollectionCookie({
      cookieValue: encodeURIComponent(
        JSON.stringify({
          v: 1,
          rowCounts: { ok: { n: 5, done: true }, legacy: 3, bad: { n: -1, done: true } },
        }),
      ),
    });
    expect(result).toEqual({ v: 1, rowCounts: { ok: { n: 5, done: true } } });
  });

  it("parses livePreview — same shape/field reader as parseAdminCookie's own, confirming a GLOBAL cookie's raw value also resolves correctly here (Decision 51's 'same shape, different cookie')", () => {
    const globalCookieValue = encodeURIComponent(
      JSON.stringify({ v: 1, density: "compact", sidebarOpen: true, livePreview: { panelOpen: true, panelSize: 55 } }),
    );
    expect(parseAdminCollectionCookie({ cookieValue: globalCookieValue })).toEqual({
      v: 1,
      livePreview: { panelOpen: true, panelSize: 55 },
    });
  });
});

describe("serializeAdminCookie", () => {
  it("round-trips through parseAdminCookie", () => {
    const value = { density: "compact" as const, sidebarOpen: true, livePreview: { panelOpen: false, panelSize: 30 } };
    const serialized = serializeAdminCookie(value);
    expect(parseAdminCookie({ cookieValue: encodeURIComponent(serialized) })).toEqual({ v: 1, ...value });
  });

  it("forces v: 1 regardless of what's passed", () => {
    expect(JSON.parse(serializeAdminCookie({} as never)).v).toBe(1);
  });
});

describe("serializeAdminCollectionCookie", () => {
  it("round-trips through parseAdminCollectionCookie", () => {
    const value = {
      chipsVisible: false,
      localViews: [{ viewId: "v1", name: "Tab" }],
      rowCounts: { default: { n: 10, done: false } },
      livePreview: { panelOpen: true, panelSize: 40 },
    };
    const serialized = serializeAdminCollectionCookie(value);
    expect(parseAdminCollectionCookie({ cookieValue: encodeURIComponent(serialized) })).toEqual({ v: 1, ...value });
  });

  it(`truncates a localViews name past ${ADMIN_COOKIE_LOCAL_VIEW_NAME_MAX_CHARS} chars`, () => {
    const longName = "x".repeat(ADMIN_COOKIE_LOCAL_VIEW_NAME_MAX_CHARS + 20);
    const serialized = serializeAdminCollectionCookie({ localViews: [{ viewId: "v1", name: longName }] });
    const parsed = parseAdminCollectionCookie({ cookieValue: encodeURIComponent(serialized) });
    expect(parsed.localViews?.[0]?.name).toHaveLength(ADMIN_COOKIE_LOCAL_VIEW_NAME_MAX_CHARS);
    expect(parsed.localViews?.[0]?.name).toBe("x".repeat(ADMIN_COOKIE_LOCAL_VIEW_NAME_MAX_CHARS));
  });

  it("leaves a short localViews name untouched", () => {
    const serialized = serializeAdminCollectionCookie({ localViews: [{ viewId: "v1", name: "Short" }] });
    const parsed = parseAdminCollectionCookie({ cookieValue: encodeURIComponent(serialized) });
    expect(parsed.localViews?.[0]?.name).toBe("Short");
  });

  it(`stays at or under ADMIN_COOKIE_MAX_BYTES, dropping rowCounts first, then the oldest localViews, for a cookie seeded with many local views`, () => {
    // Seeds WAY past the byte budget: 60 local views, each with a near-max-length name
    // (post-truncation), plus a full rowCounts map — forces BOTH caps to engage.
    const localViews = Array.from({ length: 60 }, (_, i) => ({
      viewId: `view-${i}-${"x".repeat(20)}`,
      name: `View number ${i} ${"y".repeat(ADMIN_COOKIE_LOCAL_VIEW_NAME_MAX_CHARS)}`,
    }));
    const rowCounts = Object.fromEntries(
      Array.from({ length: 10 }, (_, i) => [`view-${i}`, { n: i, done: i % 2 === 0 }]),
    );
    const serialized = serializeAdminCollectionCookie({ localViews, rowCounts });
    const byteLength = new TextEncoder().encode(serialized).length;
    expect(byteLength).toBeLessThanOrEqual(ADMIN_COOKIE_MAX_BYTES);

    const parsed = parseAdminCollectionCookie({ cookieValue: encodeURIComponent(serialized) });
    // rowCounts dropped first (cosmetic).
    expect(parsed.rowCounts).toBeUndefined();
    // The OLDEST localViews entries are the ones dropped — if any survive, they must be a
    // SUFFIX of the original (insertion-order) array, never the oldest-first entries.
    expect(parsed.localViews!.length).toBeLessThan(localViews.length);
    const survivingIds = parsed.localViews!.map((v) => v.viewId);
    const expectedSuffix = localViews.slice(localViews.length - survivingIds.length).map((v) => v.viewId);
    expect(survivingIds).toEqual(expectedSuffix);
  });

  it("forces v: 1 regardless of what's passed, even when value carries its own (different) v field", () => {
    expect(JSON.parse(serializeAdminCollectionCookie({} as never)).v).toBe(1);
    // Regression: `v: 1` must be spread LAST — a runtime `v` on `value` (e.g. a
    // malformed/forged payload) must never override it.
    expect(JSON.parse(serializeAdminCollectionCookie({ v: 2, chipsVisible: true } as never)).v).toBe(1);
  });

  it("truncates a localViews name by CODE POINT, not UTF-16 code unit — never splits a surrogate pair (e.g. an emoji)", () => {
    // "🎉" is one code point but two UTF-16 code units — a naive `.slice(0, N)`
    // on the string can land mid-surrogate-pair and produce an unpaired
    // surrogate in the stored value.
    const longEmojiName = "🎉".repeat(ADMIN_COOKIE_LOCAL_VIEW_NAME_MAX_CHARS + 5);
    const serialized = serializeAdminCollectionCookie({ localViews: [{ viewId: "v1", name: longEmojiName }] });
    const parsed = parseAdminCollectionCookie({ cookieValue: encodeURIComponent(serialized) });
    const truncatedName = parsed.localViews?.[0]?.name ?? "";
    expect([...truncatedName]).toHaveLength(ADMIN_COOKIE_LOCAL_VIEW_NAME_MAX_CHARS);
    expect(truncatedName).toBe("🎉".repeat(ADMIN_COOKIE_LOCAL_VIEW_NAME_MAX_CHARS));
    // No lone surrogate — the string round-trips through JSON without
    // `JSON.stringify` producing `\uXXXX` for an unpaired half.
    expect(JSON.stringify(truncatedName)).not.toMatch(/\\u[dD][89abAB][0-9a-fA-F]{2}(?!\\u)/);
  });
});
