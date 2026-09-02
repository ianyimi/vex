import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { VexAccessProvider } from "../context/VexAccessContext";
import { VexAuthProvider } from "../context/VexAuthContext";
import { useCanAccessAdminPanel } from "./useCanAccessAdminPanel";

function Probe() {
  return <span data-testid="probe">{String(useCanAccessAdminPanel())}</span>;
}

/**
 * This hook gates an "Admin" link in public site chrome, so a wrong answer is
 * visible to anonymous visitors.
 *
 * `hasPermission` returns `true` when it is handed no access config — server
 * side that correctly means "RBAC is not configured". Client side the same
 * absence means "no provider on this route", which is every public page, so
 * the hook must not defer to it.
 */
describe("useCanAccessAdminPanel", () => {
  it("is false with no access config in context, even though hasPermission would allow", () => {
    render(<Probe />);
    expect(screen.getByTestId("probe").textContent).toBe("false");
  });

  it("is false for an anonymous visitor when an access config is present", () => {
    render(
      <VexAccessProvider
        access={{
          defaultPermissionMode: "deny",
          enabled: true,
          permissions: { admin: { "*": true }, user: {} },
          resources: [],
          roles: ["admin", "user"],
          userCollectionSlug: "user",
          userRolesField: "roles",
        }}
      >
        <Probe />
      </VexAccessProvider>,
    );
    expect(screen.getByTestId("probe").textContent).toBe("false");
  });

  it("is true for a user holding a role that grants the admin panel", () => {
    render(
      <VexAccessProvider
        access={{
          defaultPermissionMode: "deny",
          enabled: true,
          permissions: { admin: { "*": true }, user: {} },
          resources: [],
          roles: ["admin", "user"],
          userCollectionSlug: "user",
          userRolesField: "roles",
        }}
      >
        <VexAuthProvider value={{ user: { roles: ["admin"] } }}>
          <Probe />
        </VexAuthProvider>
      </VexAccessProvider>,
    );
    expect(screen.getByTestId("probe").textContent).toBe("true");
  });
});
