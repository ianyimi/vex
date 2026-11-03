import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { defineConfig } from "@vexcms/core";
import { VexConfigProvider, useVexAccess, useVexConfig } from "./VexConfigContext";

function ConfigProbe() {
  return <span data-testid="probe">{useVexConfig().basePath}</span>;
}

function AccessProbe() {
  return <span data-testid="probe">{String(useVexAccess())}</span>;
}

describe("useVexConfig", () => {
  it("throws a clear error naming VexConfigProvider when rendered with no provider", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(() => render(<ConfigProbe />)).toThrow(/VexConfigProvider/);
    } finally {
      consoleError.mockRestore();
    }
  });

  it("returns the provided config when rendered inside VexConfigProvider", () => {
    render(
      <VexConfigProvider config={defineConfig({ basePath: "/custom-admin" })}>
        <ConfigProbe />
      </VexConfigProvider>,
    );
    expect(screen.getByTestId("probe").textContent).toBe("/custom-admin");
  });
});

describe("useVexAccess", () => {
  it("returns undefined with no provider mounted, instead of throwing", () => {
    render(<AccessProbe />);
    expect(screen.getByTestId("probe").textContent).toBe("undefined");
  });
});
