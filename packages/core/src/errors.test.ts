import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";

import { extractVexErrorData, VexError } from "./errors";

describe("VexError", () => {
  it("carries structured data unchanged", () => {
    const error = new VexError({ code: "SLUG_CONFLICT", message: "Slug taken" });
    expect(error.data).toEqual({ code: "SLUG_CONFLICT", message: "Slug taken" });
    expect(error.name).toBe("VexError");
  });

  it("is a ConvexError, so Convex delivers its data to the client", () => {
    expect(new VexError("nope")).toBeInstanceOf(ConvexError);
  });
});

describe("extractVexErrorData", () => {
  it("returns undefined for a non-ConvexError", () => {
    expect(extractVexErrorData(new Error("plain"))).toBeUndefined();
    expect(extractVexErrorData("nope")).toBeUndefined();
    expect(extractVexErrorData(undefined)).toBeUndefined();
  });

  it("reads structured data directly off a VexError (in-process, no wire crossing)", () => {
    const error = new VexError({ code: "UNINDEXED_SORT", message: "no index" });
    expect(extractVexErrorData(error)).toEqual({ code: "UNINDEXED_SORT", message: "no index" });
  });

  it("reads structured data off a plain ConvexError (the shape a real Convex client reconstructs — VexError's own subclass identity is lost crossing the wire)", () => {
    const error = new ConvexError({ code: "UNINDEXED_SORT", message: "no index" });
    expect(extractVexErrorData(error)).toEqual({ code: "UNINDEXED_SORT", message: "no index" });
  });

  it("returns undefined for a ConvexError whose data is a string with no embedded VexError JSON", () => {
    expect(extractVexErrorData(new ConvexError("just a string"))).toBeUndefined();
  });

  it("parses the embedded JSON out of a local Convex dev server's own diagnostic-string wrapping, discarding the stack trace", () => {
    const devServerError = new ConvexError(
      '[CONVEX Q(vex:find)] [Request ID: abc123] Server Error\n' +
        'Uncaught VexError: {"code":"UNINDEXED_SORT","collection":"posts","field":"title","message":"sort.field \\"title\\" leads no index."}\n' +
        '    at resolveQueryIndex2 (../../../../packages/core/src/collections/query/resolveQueryIndex.ts:210:6)\n' +
        '    at find (../../../../packages/core/src/collections/api/find/server.ts:262:21)',
    );
    const result = extractVexErrorData(devServerError);
    expect(result).toMatchObject({
      code: "UNINDEXED_SORT",
      message: 'sort.field "title" leads no index.',
    });
    expect(JSON.stringify(result)).not.toContain("resolveQueryIndex");
    expect(JSON.stringify(result)).not.toContain("Request ID");
  });
});
