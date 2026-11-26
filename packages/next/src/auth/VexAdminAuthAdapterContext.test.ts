import { describe, expect, it } from "vitest";
import { VexAdminAuthAdapterContext } from "./VexAdminAuthAdapterContext";

describe("VexAdminAuthAdapterContext", () => {
  it("is the same context instance when the module is evaluated twice", async () => {
    // Dynamic import on purpose: the `?copy` query loads this file as a second, separate module, the way a bundler that duplicates it would.
    const copySpecifier = "./VexAdminAuthAdapterContext?copy";
    const copy: { VexAdminAuthAdapterContext: unknown } = await import(/* @vite-ignore */ copySpecifier);
    expect(copy.VexAdminAuthAdapterContext).toBe(VexAdminAuthAdapterContext);
  });
});
