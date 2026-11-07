import { describe, expect, it } from "vitest";
import { classifyTelemetryError } from "./classifyTelemetryError";

function namedError(name: string): Error {
  const error = new Error("boom");
  error.name = name;
  return error;
}

describe("classifyTelemetryError", () => {
  it("maps VexConfigError to configError", () => {
    expect(classifyTelemetryError({ error: namedError("VexConfigError") })).toBe("configError");
  });

  it("maps VexAccessConfigError to accessConfigError", () => {
    expect(classifyTelemetryError({ error: namedError("VexAccessConfigError") })).toBe("accessConfigError");
  });

  it("maps VexAuthConfigError to authConfigError", () => {
    expect(classifyTelemetryError({ error: namedError("VexAuthConfigError") })).toBe("authConfigError");
  });

  it("maps VexComponentConfigError to componentConfigError", () => {
    expect(classifyTelemetryError({ error: namedError("VexComponentConfigError") })).toBe("componentConfigError");
  });

  it("maps VexStorageConfigError to storageConfigError", () => {
    expect(classifyTelemetryError({ error: namedError("VexStorageConfigError") })).toBe("storageConfigError");
  });

  it("returns unknown for an unrecognized Error name", () => {
    expect(classifyTelemetryError({ error: namedError("SyntaxError") })).toBe("unknown");
  });

  it("returns unknown for a non-Error value", () => {
    expect(classifyTelemetryError({ error: "boom" })).toBe("unknown");
  });
});
