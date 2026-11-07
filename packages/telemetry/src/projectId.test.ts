import { mkdtempSync, rmSync, symlinkSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createProjectId } from "./projectId";

describe("createProjectId", () => {
  let projectDir: string;

  beforeEach(() => {
    projectDir = mkdtempSync(join(tmpdir(), "vex-telemetry-"));
  });

  afterEach(() => {
    rmSync(projectDir, { recursive: true, force: true });
  });

  it("returns a 64-character lowercase hex string", () => {
    const id = createProjectId({ salt: "fixed-salt", projectDir });

    expect(id).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic for the same salt and project directory", () => {
    const first = createProjectId({ salt: "fixed-salt", projectDir });
    const second = createProjectId({ salt: "fixed-salt", projectDir });

    expect(first).toBe(second);
  });

  it("differs when the salt differs", () => {
    const withSaltA = createProjectId({ salt: "salt-a", projectDir });
    const withSaltB = createProjectId({ salt: "salt-b", projectDir });

    expect(withSaltA).not.toBe(withSaltB);
  });

  it("differs when the project directory differs", () => {
    const otherDir = mkdtempSync(join(tmpdir(), "vex-telemetry-other-"));

    try {
      const idForProjectDir = createProjectId({ salt: "fixed-salt", projectDir });
      const idForOtherDir = createProjectId({ salt: "fixed-salt", projectDir: otherDir });

      expect(idForProjectDir).not.toBe(idForOtherDir);
    } finally {
      rmSync(otherDir, { recursive: true, force: true });
    }
  });

  it("produces the same id for a symlink and its real target", () => {
    const linkPath = join(tmpdir(), `vex-telemetry-link-${process.pid}-${Date.now()}`);
    symlinkSync(projectDir, linkPath);

    try {
      const idForRealPath = createProjectId({ salt: "fixed-salt", projectDir });
      const idForSymlink = createProjectId({ salt: "fixed-salt", projectDir: linkPath });

      expect(idForSymlink).toBe(idForRealPath);
    } finally {
      unlinkSync(linkPath);
    }
  });
});
