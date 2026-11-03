import { describe, expect, it, vi } from "vitest";
import { pickConvexQueryIndex } from "./pickConvexQueryIndex";
import type { ConvexQueryIndexRangeFn } from "./convexTypes";

function recordingBuilder() {
  const calls: Array<[string, unknown]> = [];
   
  const builder: any = {
    eq: (field: string, value: unknown) => {
      calls.push([field, value]);
      return builder;
    },
    gte: (field: string, value: unknown) => {
      calls.push([field, value]);
      return builder;
    },
  };
  return { builder, calls };
}

describe("pickConvexQueryIndex — free slot", () => {
  it("gives the access index the slot when the caller supplies none", () => {
    const accessIndex = {
      name: "by_author",
       
      range: (q: any) => q.eq("authorId", "dana"),
    };
    expect(pickConvexQueryIndex({ accessIndex })).toEqual(accessIndex);
  });
});

describe("pickConvexQueryIndex — same name merges ranges", () => {
  it("composes access's range then the caller's range on the same builder", () => {
    const selection = pickConvexQueryIndex({
      accessIndex: {
        name: "by_author_category",
         
        range: (q: any) => q.eq("authorId", "dana"),
      },
      callerIndex: {
        name: "by_author_category",
         
        range: (q: any) => q.eq("categoryId", "news"),
      },
    });
    expect(selection?.name).toBe("by_author_category");
    const { builder, calls } = recordingBuilder();
    selection?.range?.(builder);
    expect(calls).toEqual([
      ["authorId", "dana"],
      ["categoryId", "news"],
    ]);
  });
});

describe("pickConvexQueryIndex — different name: caller wins and warns once", () => {
  it("gives the slot to the caller's index and warns exactly once for the same pair", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const accessIndex = {
      name: "by_status",
       
      range: (q: any) => q.eq("status", "published"),
    };
    const callerIndex = {
      name: "by_slug",
       
      range: (q: any) => q.eq("slug", "about"),
    };

    const first = pickConvexQueryIndex({ accessIndex, callerIndex });
    const second = pickConvexQueryIndex({ accessIndex, callerIndex });

    expect(first).toEqual(callerIndex);
    expect(second).toEqual(callerIndex);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const [message] = warnSpy.mock.calls[0] as [string];
    expect(message).toContain("by_status");
    expect(message).toContain("by_slug");
    warnSpy.mockRestore();
  });

  it("warns independently for a different displaced pair", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    pickConvexQueryIndex({
      accessIndex: {
        name: "by_region",
         
        range: (q: any) => q.eq("region", "us"),
      },
      callerIndex: {
        name: "by_locale",
         
        range: (q: any) => q.eq("locale", "en"),
      },
    });
    pickConvexQueryIndex({
      accessIndex: {
        name: "by_team",
         
        range: (q: any) => q.eq("team", "eng"),
      },
      callerIndex: {
        name: "by_priority",
         
        range: (q: any) => q.eq("priority", "high"),
      },
    });

    expect(warnSpy).toHaveBeenCalledTimes(2);
    warnSpy.mockRestore();
  });
});

describe("pickConvexQueryIndex — no access index: caller passthrough", () => {
  it("returns the caller's index unchanged when there is no access index", () => {
    const callerIndex = {
      name: "by_updated",
       
      range: (q: any) => q.gte("updatedAt", 100),
    };
    expect(pickConvexQueryIndex({ callerIndex })).toEqual(callerIndex);
  });
});

describe("pickConvexQueryIndex — nothing supplied", () => {
  it("returns undefined when neither an access index nor a caller index applies", () => {
    expect(pickConvexQueryIndex({})).toBeUndefined();
  });
});

describe("pickConvexQueryIndex — same name, caller supplies no range", () => {
  it("keeps only the access range when the caller named the same index purely for ordering", () => {
    const selection = pickConvexQueryIndex({
      accessIndex: {
        name: "by_author_category",
        range: (q: Parameters<ConvexQueryIndexRangeFn>[0]) => q.eq("authorId", "dana"),
      },
      // No `range` at all — a caller may name an index purely to order results.
      callerIndex: { name: "by_author_category" },
    });
    expect(selection?.name).toBe("by_author_category");
    const { builder, calls } = recordingBuilder();
    selection?.range?.(builder);
    // Composing with an absent second range returns `first` unchanged — the
    // caller's own request contributed nothing to compose against.
    expect(calls).toEqual([["authorId", "dana"]]);
  });
});

describe("pickConvexQueryIndex — signals indexAlreadyApplied correctly for find/server.ts's downstream wiring", () => {
  // `find/server.ts` derives this flag straight from `pickConvexQueryIndex`'s own result:
  // `accessIndex !== undefined && resolvedIndex?.name === accessIndex.name`. Getting
  // it wrong either direction is a correctness bug — see `resolveAccessRule.test.ts`'s
  // "resolveQueryConstraint — indexAlreadyApplied" for what a wrong value does
  // downstream (redundantly re-checks an already-narrowed range as a filter, or
  // silently skips checking a displaced one at all).

  it("free slot: the access index claims the withIndex call outright", () => {
    const accessIndex = {
      name: "by_status",
      range: (q: Parameters<ConvexQueryIndexRangeFn>[0]) => q.eq("status", "published"),
    };
    const resolvedIndex = pickConvexQueryIndex({ accessIndex });
    expect(accessIndex !== undefined && resolvedIndex?.name === accessIndex.name).toBe(true);
  });

  it("same name: the merged range IS the access index's own range, applied", () => {
    const accessIndex = {
      name: "by_status",
      range: (q: Parameters<ConvexQueryIndexRangeFn>[0]) => q.eq("status", "published"),
    };
    const callerIndex = {
      name: "by_status",
      range: (q: Parameters<ConvexQueryIndexRangeFn>[0]) => q.eq("status", "published"),
    };
    const resolvedIndex = pickConvexQueryIndex({ accessIndex, callerIndex });
    expect(accessIndex !== undefined && resolvedIndex?.name === accessIndex.name).toBe(true);
  });

  it("different name: the caller's index wins, so the access index was NEVER applied to the query", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const accessIndex = {
      name: "idx_access_only",
      range: (q: Parameters<ConvexQueryIndexRangeFn>[0]) => q.eq("status", "published"),
    };
    const callerIndex = {
      name: "idx_caller_only",
      range: (q: Parameters<ConvexQueryIndexRangeFn>[0]) => q.eq("slug", "about"),
    };
    const resolvedIndex = pickConvexQueryIndex({ accessIndex, callerIndex });
    expect(accessIndex !== undefined && resolvedIndex?.name === accessIndex.name).toBe(false);
    warnSpy.mockRestore();
  });

});
