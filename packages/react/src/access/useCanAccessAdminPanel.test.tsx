import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { defineConfig } from "@vexcms/core";
import { VexConfigProvider } from "../config/VexConfigContext";
import { VexAuthProvider } from "../auth/VexAuthContext";
import { VexSessionAdapterProvider, type VexSessionState } from "../auth/VexSessionAdapterContext";
import { useCanAccessAdminPanel } from "./useCanAccessAdminPanel";

function Probe() {
  const { canAccess, isPending } = useCanAccessAdminPanel();
  return <span data-testid="probe">{`${canAccess}/${isPending}`}</span>;
}

const accessConfig = defineConfig({
  access: {
    defaultPermissionMode: "deny",
    enabled: true,
    permissions: { admin: { "*": true }, user: {} },
    resources: [],
    roles: ["admin", "user"],
    userCollectionSlug: "user",
    userRolesField: "roles",
    organizations: false,
  },
});

function withSession(session: VexSessionState) {
  return (
    <VexConfigProvider config={accessConfig}>
      <VexSessionAdapterProvider value={{ useSession: () => session }}>
        <Probe />
      </VexSessionAdapterProvider>
    </VexConfigProvider>
  );
}

/**
 * This hook gates an "Admin" link in public site chrome, so a wrong answer is
 * visible to anonymous visitors.
 *
 * `hasPermission` returns `true` when it is handed no access config — server
 * side that correctly means "RBAC is not configured". Client side the same
 * absence means "no config/session in scope yet", which must not grant
 * access either, so the hook must not defer to it.
 */
describe("useCanAccessAdminPanel", () => {
  describe("inside /admin (VexAuthProvider mounted)", () => {
    it("is false with no access config in context, even though hasPermission would allow", () => {
      render(<Probe />);
      expect(screen.getByTestId("probe").textContent).toBe("false/false");
    });

    it("is false for an anonymous visitor when an access config is present", () => {
      render(<VexConfigProvider config={accessConfig}><Probe /></VexConfigProvider>);
      expect(screen.getByTestId("probe").textContent).toBe("false/false");
    });

    it("is true for a user holding a role that grants the admin panel", () => {
      render(
        <VexConfigProvider config={accessConfig}>
          <VexAuthProvider value={{ user: { roles: ["admin"] } }}>
            <Probe />
          </VexAuthProvider>
        </VexConfigProvider>,
      );
      expect(screen.getByTestId("probe").textContent).toBe("true/false");
    });

    it("is false for a signed-in user holding a role that lacks the admin panel", () => {
      render(
        <VexConfigProvider config={accessConfig}>
          <VexAuthProvider value={{ user: { roles: ["user"] } }}>
            <Probe />
          </VexAuthProvider>
        </VexConfigProvider>,
      );
      expect(screen.getByTestId("probe").textContent).toBe("false/false");
    });
  });

  describe("outside /admin (no VexAuthProvider — public page, VexSessionAdapterProvider instead)", () => {
    it("is false with no VexSessionAdapterProvider mounted at all", () => {
      render(<VexConfigProvider config={accessConfig}><Probe /></VexConfigProvider>);
      expect(screen.getByTestId("probe").textContent).toBe("false/false");
    });

    it("is pending while the client session is still resolving", () => {
      render(withSession({ user: null, isPending: true }));
      expect(screen.getByTestId("probe").textContent).toBe("false/true");
    });

    it("is false once resolved signed out", () => {
      render(withSession({ user: null, isPending: false }));
      expect(screen.getByTestId("probe").textContent).toBe("false/false");
    });

    it("is true for a signed-in admin, resolved via the session adapter", () => {
      render(withSession({ user: { roles: ["admin"] }, isPending: false }));
      expect(screen.getByTestId("probe").textContent).toBe("true/false");
    });

    it("is false for a signed-in user holding a role that lacks the admin panel", () => {
      render(withSession({ user: { roles: ["user"] }, isPending: false }));
      expect(screen.getByTestId("probe").textContent).toBe("false/false");
    });
  });
});
