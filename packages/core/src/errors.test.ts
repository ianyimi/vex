import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";

import { VexError } from "./errors";

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
