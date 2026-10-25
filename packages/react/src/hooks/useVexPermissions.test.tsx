import type { ReactNode } from "react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useVexPermissions } from "./useVexPermissions";
import { VexConfigProvider } from "../context/VexConfigContext";
import { VexAuthProvider } from "../context/VexAuthContext";
import { defineConfig } from "@vexcms/core";
import { testAccess, testCollection, testUsers } from "../testing/harness/accessFixtures";

function Providers(access: typeof testAccess.allowed | undefined, user: Record<string, unknown> | null) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(VexConfigProvider, {
      config: defineConfig({ collections: [testCollection], access }),
      children: createElement(VexAuthProvider, { value: { user }, children }),
    });
  };
}

describe("useVexPermissions — no access config", () => {
  it("resolves true for any resource/action (escape hatch, not fail-closed)", () => {
    const { result } = renderHook(() => useVexPermissions(), {
      wrapper: Providers(undefined, null),
    });
    expect(result.current.hasPermission("posts", "read")).toBe(true);
  });
});

describe("useVexPermissions — delegates to core's hasPermission with a configured access matrix", () => {
  it("resolves false for a role with no grants", () => {
    const { result } = renderHook(() => useVexPermissions(), {
      wrapper: Providers(testAccess.denied, testUsers.denied),
    });
    expect(result.current.hasPermission("posts", "read")).toBe(false);
  });

  it("resolves true for a role granted everything", () => {
    const { result } = renderHook(() => useVexPermissions(), {
      wrapper: Providers(testAccess.allowed, testUsers.allowed),
    });
    expect(result.current.hasPermission("posts", "read")).toBe(true);
  });
});
