import { describe, expect, it, vi } from "vitest";
import { pickQueryIndex } from "./pickQueryIndex";
import type { IndexRangeFn } from "./types";

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

describe("pickQueryIndex — free slot", () => {
  it("gives the access index the slot when the caller supplies none", () => {
    const accessIndex = {
      name: "by_author",
       
      range: (q: any) => q.eq("authorId", "dana"),
    };
    expect(pickQueryIndex({ accessIndex })).toEqual(accessIndex);
  });
});

describe("pickQueryIndex — same name merges ranges", () => {
  it("composes access's range then the caller's range on the same builder", () => {
    const selection = pickQueryIndex({
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

describe("pickQueryIndex — different name: caller wins and warns once", () => {
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

    const first = pickQueryIndex({ accessIndex, callerIndex });
    const second = pickQueryIndex({ accessIndex, callerIndex });

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

    pickQueryIndex({
      accessIndex: {
        name: "by_region",
         
        range: (q: any) => q.eq("region", "us"),
      },
      callerIndex: {
        name: "by_locale",
         
        range: (q: any) => q.eq("locale", "en"),
      },
    });
    pickQueryIndex({
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

describe("pickQueryIndex — no access index: caller passthrough", () => {
  it("returns the caller's index unchanged when there is no access index", () => {
    const callerIndex = {
      name: "by_updated",
       
      range: (q: any) => q.gte("updatedAt", 100),
    };
    expect(pickQueryIndex({ callerIndex })).toEqual(callerIndex);
  });
});

describe("pickQueryIndex — nothing supplied", () => {
  it("returns undefined when neither an access index nor a caller index applies", () => {
    expect(pickQueryIndex({})).toBeUndefined();
  });
});

describe("pickQueryIndex — same name, caller supplies no range", () => {
  it("keeps only the access range when the caller named the same index purely for ordering", () => {
    const selection = pickQueryIndex({
      accessIndex: {
        name: "by_author_category",
        range: (q: Parameters<IndexRangeFn>[0]) => q.eq("authorId", "dana"),
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

describe("pickQueryIndex — signals indexAlreadyApplied correctly for find/server.ts's downstream wiring", () => {
  // `find/server.ts` derives this flag straight from `pickQueryIndex`'s own result:
  // `accessIndex !== undefined && resolvedIndex?.name === accessIndex.name`. Getting
  // it wrong either direction is a correctness bug — see `resolveAccessRule.test.ts`'s
  // "resolveAccessConstraint — indexAlreadyApplied" for what a wrong value does
  // downstream (redundantly re-checks an already-narrowed range as a filter, or
  // silently skips checking a displaced one at all).

  it("free slot: the access index claims the withIndex call outright", () => {
    const accessIndex = {
      name: "by_status",
      range: (q: Parameters<IndexRangeFn>[0]) => q.eq("status", "published"),
    };
    const resolvedIndex = pickQueryIndex({ accessIndex });
    expect(accessIndex !== undefined && resolvedIndex?.name === accessIndex.name).toBe(true);
  });

  it("same name: the merged range IS the access index's own range, applied", () => {
    const accessIndex = {
      name: "by_status",
      range: (q: Parameters<IndexRangeFn>[0]) => q.eq("status", "published"),
    };
    const callerIndex = {
      name: "by_status",
      range: (q: Parameters<IndexRangeFn>[0]) => q.eq("status", "published"),
    };
    const resolvedIndex = pickQueryIndex({ accessIndex, callerIndex });
    expect(accessIndex !== undefined && resolvedIndex?.name === accessIndex.name).toBe(true);
  });

  it("different name: the caller's index wins, so the access index was NEVER applied to the query", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const accessIndex = {
      name: "idx_access_only",
      range: (q: Parameters<IndexRangeFn>[0]) => q.eq("status", "published"),
    };
    const callerIndex = {
      name: "idx_caller_only",
      range: (q: Parameters<IndexRangeFn>[0]) => q.eq("slug", "about"),
    };
    const resolvedIndex = pickQueryIndex({ accessIndex, callerIndex });
    expect(accessIndex !== undefined && resolvedIndex?.name === accessIndex.name).toBe(false);
    warnSpy.mockRestore();
  });

});
