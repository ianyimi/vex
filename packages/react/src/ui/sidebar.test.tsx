import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ADMIN_COOKIE_NAME, parseAdminCookie } from "@vexcms/core";
import { expectNoA11yViolations } from "../testing/a11y";
import { VexConfigProvider } from "../config/VexConfigContext";
import { Sidebar, SidebarContent, SidebarProvider, SidebarTrigger } from "./sidebar";

afterEach(() => {
  document.cookie = `${ADMIN_COOKIE_NAME}=; path=/; max-age=0`;
});

function readSidebarOpenCookie(): boolean | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${ADMIN_COOKIE_NAME}=([^;]*)`));
  return parseAdminCookie({ cookieValue: match?.[1] }).sidebarOpen;
}

function renderSidebar(basePath = "/") {
  return render(
    <VexConfigProvider config={{ basePath } as Parameters<typeof VexConfigProvider>[0]["config"]}>
      <SidebarProvider defaultOpen={true}>
        <Sidebar>
          <SidebarContent>content</SidebarContent>
        </Sidebar>
        <SidebarTrigger />
      </SidebarProvider>
    </VexConfigProvider>,
  );
}

describe("SidebarProvider", () => {
  it("writes sidebarOpen into the consolidated vex-admin cookie on toggle", async () => {
    const user = userEvent.setup();
    renderSidebar();
    expect(readSidebarOpenCookie()).toBeUndefined();

    await user.click(screen.getByRole("button", { name: "Toggle Sidebar" }));
    expect(readSidebarOpenCookie()).toBe(false);

    await user.click(screen.getByRole("button", { name: "Toggle Sidebar" }));
    expect(readSidebarOpenCookie()).toBe(true);
  });

  it("preserves other vex-admin fields already on the cookie when toggling", async () => {
    document.cookie = `${ADMIN_COOKIE_NAME}=${encodeURIComponent(JSON.stringify({ v: 1, density: "compact" }))}; path=/`;
    const user = userEvent.setup();
    renderSidebar();

    await user.click(screen.getByRole("button", { name: "Toggle Sidebar" }));
    const match = document.cookie.match(new RegExp(`(?:^|; )${ADMIN_COOKIE_NAME}=([^;]*)`));
    expect(parseAdminCookie({ cookieValue: match?.[1] })).toEqual({ v: 1, density: "compact", sidebarOpen: false });
  });

  it("throws a clear error naming VexConfigProvider when rendered with no provider (SidebarProvider now reads useVexConfig)", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(() =>
        render(
          <SidebarProvider defaultOpen={true}>
            <Sidebar>
              <SidebarContent>content</SidebarContent>
            </Sidebar>
          </SidebarProvider>,
        ),
      ).toThrow(/VexConfigProvider/);
    } finally {
      consoleError.mockRestore();
    }
  });
});

describe("Sidebar a11y", () => {
  it("has no detectable accessibility violations", async () => {
    const { container } = renderSidebar();
    await expectNoA11yViolations(container);
  });

  it("makes the off-canvas sidebar container inert while collapsed, so it drops out of keyboard/AT focus entirely", async () => {
    const user = userEvent.setup();
    renderSidebar();
    const container_ = screen.getByText("content").closest('[data-slot="sidebar-container"]') as HTMLElement;
    expect(container_).not.toHaveAttribute("inert");

    await user.click(screen.getByRole("button", { name: "Toggle Sidebar" }));
    expect(container_).toHaveAttribute("inert");

    await user.click(screen.getByRole("button", { name: "Toggle Sidebar" }));
    expect(container_).not.toHaveAttribute("inert");
  });
});
