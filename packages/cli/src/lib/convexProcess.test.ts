import { beforeEach, describe, expect, it, vi } from "vitest";

const { execFileSync } = vi.hoisted(() => ({ execFileSync: vi.fn() }));

vi.mock("node:child_process", () => ({
  execFileSync,
  spawn: vi.fn(),
}));

import { deployToProduction, stripCmdFlags } from "./convexProcess";

describe("stripCmdFlags", () => {
  it("strips --cmd and its value", () => {
    expect(stripCmdFlags(["--cmd", "pnpm build"])).toEqual([]);
  });

  it("strips --cmd-url-env-var-name and its value", () => {
    expect(stripCmdFlags(["--cmd-url-env-var-name", "VITE_CONVEX_URL"])).toEqual([]);
  });

  it("strips both while keeping unrelated flags, in order", () => {
    expect(
      stripCmdFlags(["--preview-create", "x", "--cmd", "pnpm build", "--cmd-url-env-var-name", "VITE_CONVEX_URL"]),
    ).toEqual(["--preview-create", "x"]);
  });

  it("leaves args with no --cmd flags untouched", () => {
    expect(stripCmdFlags(["--preview-create", "x"])).toEqual(["--preview-create", "x"]);
  });
});

describe("deployToProduction", () => {
  beforeEach(() => {
    execFileSync.mockReset();
  });

  it("passes convexArgs through to the underlying convex deploy call", () => {
    deployToProduction({ cwd: "/project", convexArgs: ["--cmd", "pnpm build"] });

    expect(execFileSync).toHaveBeenCalledTimes(1);
    const [, argv] = execFileSync.mock.calls[0];
    expect(argv).toEqual(expect.arrayContaining(["convex", "deploy", "--cmd", "pnpm build"]));
  });

  it("runs with no timeout, unlike every other convex command", () => {
    deployToProduction({ cwd: "/project" });

    const [, , options] = execFileSync.mock.calls[0];
    expect(options).not.toHaveProperty("timeout");
  });
});
