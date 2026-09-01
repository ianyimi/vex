import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resolveConvexUrl } from "./resolveConvexUrl";

describe("resolveConvexUrl", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "vex-cli-url-"));
    // Empty string is falsy to the resolver's guards — neutralizes any
    // real values in the developer's shell without deleting them.
    vi.stubEnv("CONVEX_URL", "");
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("prefers the CONVEX_URL env var over everything", () => {
    vi.stubEnv("CONVEX_URL", "https://env.convex.cloud");
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://public.convex.cloud");
    writeFileSync(join(tmpDir, ".env.local"), "CONVEX_URL=https://file.convex.cloud\n");
    expect(resolveConvexUrl(tmpDir)).toBe("https://env.convex.cloud");
  });

  it("falls back to NEXT_PUBLIC_CONVEX_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://public.convex.cloud");
    expect(resolveConvexUrl(tmpDir)).toBe("https://public.convex.cloud");
  });

  it("parses .env.local, skipping comments and stripping quotes", () => {
    writeFileSync(
      join(tmpDir, ".env.local"),
      '# deployment\nUNRELATED=x\nNEXT_PUBLIC_CONVEX_URL="https://file.convex.cloud"\n',
    );
    expect(resolveConvexUrl(tmpDir)).toBe("https://file.convex.cloud");
  });

  it("returns null when no source has a value", () => {
    expect(resolveConvexUrl(tmpDir)).toBeNull();
  });

  it("returns null for an empty assignment in .env.local", () => {
    writeFileSync(join(tmpDir, ".env.local"), "CONVEX_URL=\n");
    expect(resolveConvexUrl(tmpDir)).toBeNull();
  });
});
