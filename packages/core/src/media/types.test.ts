import { describe, it, expect } from "vitest";
import { VexStorageConfigError } from "./types";

describe("VexStorageConfigError", () => {
  it("has the correct name", () => {
    const error = new VexStorageConfigError("test");
    expect(error.name).toBe("VexStorageConfigError");
  });

  it("carries the message", () => {
    const error = new VexStorageConfigError("missing field");
    expect(error.message).toBe("missing field");
  });
});
