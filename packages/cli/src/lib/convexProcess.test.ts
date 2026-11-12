import { beforeEach, describe, expect, it, vi } from "vitest";

const { execFileSync } = vi.hoisted(() => ({ execFileSync: vi.fn() }));

vi.mock("node:child_process", () => ({
  execFileSync,
  spawn: vi.fn(),
}));

import {
  buildDevOnceArgs,
  DEPLOY_FINAL_ONLY_FLAGS,
  deployToProduction,
  DEV_FINAL_ONLY_FLAGS,
  stripConvexFlags,
  waitForDeploy,
} from "./convexProcess";

describe("stripConvexFlags", () => {
  it("strips the deploy build flags and their values, keeping everything else in order", () => {
    expect(
      stripConvexFlags({
        convexArgs: ["--preview-create", "x", "--cmd", "pnpm build", "--cmd-url-env-var-name", "VITE_CONVEX_URL"],
        flags: DEPLOY_FINAL_ONLY_FLAGS,
      }),
    ).toEqual(["--preview-create", "x"]);
  });

  it("strips the dev post-push flags in both --flag value and --flag=value form", () => {
    expect(
      stripConvexFlags({
        convexArgs: ["--tail-logs", "always", "--run", "init:seed", "--run-component=workflow", "--start", "next dev", "-v"],
        flags: DEV_FINAL_ONLY_FLAGS,
      }),
    ).toEqual(["--tail-logs", "always", "-v"]);
  });

  it("leaves args with none of the flags untouched", () => {
    expect(stripConvexFlags({ convexArgs: ["--preview-create", "x"], flags: DEPLOY_FINAL_ONLY_FLAGS })).toEqual([
      "--preview-create",
      "x",
    ]);
  });
});

describe("buildDevOnceArgs", () => {
  it("disables typecheck and codegen by default and appends the forwarded flags", () => {
    expect(buildDevOnceArgs(["--env-file", ".env.test"])).toEqual([
      "dev",
      "--once",
      "--typecheck",
      "disable",
      "--codegen",
      "disable",
      "--env-file",
      ".env.test",
    ]);
  });

  it("lets a forwarded --typecheck or --codegen=… replace the default", () => {
    expect(buildDevOnceArgs(["--typecheck", "enable", "--codegen=enable"])).toEqual([
      "dev",
      "--once",
      "--typecheck",
      "enable",
      "--codegen=enable",
    ]);
  });
});

describe("waitForDeploy without a managed convex dev process", () => {
  beforeEach(() => {
    execFileSync.mockReset();
  });

  it("runs a standalone convex dev --once push carrying the forwarded flags", async () => {
    await expect(waitForDeploy({ cwd: "/project", convexArgs: ["--env-file", ".env.test"] })).resolves.toBe(true);

    const [, argv] = execFileSync.mock.calls[0];
    expect(argv.slice(argv.indexOf("convex"))).toEqual([
      "convex",
      "dev",
      "--once",
      "--typecheck",
      "disable",
      "--codegen",
      "disable",
      "--env-file",
      ".env.test",
    ]);
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
