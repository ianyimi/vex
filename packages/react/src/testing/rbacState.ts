import { Fragment, createElement } from "react";
import type { ReactNode } from "react";
import { describe, it } from "vitest";
import type { RenderResult } from "@testing-library/react";
import type { VexAccessConfig } from "@vexcms/core";
import { usePermission } from "../hooks/usePermission";
import { renderWithVexProviders, testAccess, testCollection, testUsers } from "./harness/accessFixtures";

/** One RBAC scenario to render and assert: a name, the access config to provide, and the caller. */
export interface RbacScenario {
  name: string;
  access: VexAccessConfig | undefined;
  user: unknown;
}

/** Options for {@link runRbacStateSuite}. */
export interface RbacStateOptions {
  /** Defaults to the `testAccess`/`testUsers`-derived `{none, anonymous, denied, allowed, scoped}`. */
  scenarios?: RbacScenario[];
  render: (permission: boolean) => ReactNode;
  /** Given the rendered result and which scenario produced it, assert the expected behavior. */
  assert: (utils: RenderResult, scenario: RbacScenario, permission: boolean) => void;
}

const defaultScenarios: RbacScenario[] = [
  { name: "none", access: testAccess.none, user: undefined },
  { name: "anonymous", access: testAccess.anonymous, user: undefined },
  { name: "denied", access: testAccess.denied, user: testUsers.denied },
  { name: "allowed", access: testAccess.allowed, user: testUsers.allowed },
  { name: "scoped", access: testAccess.scoped, user: testUsers.scoped },
];

/**
 * Mounted once per scenario inside `renderWithVexProviders`. Reads the real
 * `usePermission` hook against `testCollection`, reports the resolved boolean
 * back to the caller via `onPermission` (React render is synchronous under
 * RTL, so the value is available immediately after `render()` returns), then
 * delegates to the suite caller's own `render`.
 *
 * `as never` on the `usePermission` props mirrors `usePermission.test.tsx` —
 * React tests run against the unaugmented `GeneratedVexTypes` registry, so
 * `resource`/`action` can't narrow against the wide default `TSubjects`.
 *
 * @returns The rendered node for the current scenario's `render` callback.
 */
function RbacHarness(props: { render: (permission: boolean) => ReactNode; onPermission: (permission: boolean) => void }) {
  const permission = usePermission({ resource: testCollection.slug, action: "read" } as never);
  props.onPermission(permission);
  return createElement(Fragment, null, props.render(permission));
}

/**
 * Call at module top level inside a *.test.ts file — it calls describe/it itself.
 *
 * @param options - Scenario rendering and assertion callbacks.
 */
export function runRbacStateSuite(options: RbacStateOptions): void {
  const scenarios = options.scenarios ?? defaultScenarios;

  describe("RBAC state", () => {
    for (const scenario of scenarios) {
      it(`resolves the "${scenario.name}" scenario`, () => {
        let permission = false;
        const utils = renderWithVexProviders(
          createElement(RbacHarness, {
            render: options.render,
            onPermission: (value) => {
              permission = value;
            },
          }),
          { access: scenario.access, auth: { user: (scenario.user ?? null) as Record<string, unknown> | null } },
        );
        options.assert(utils, scenario, permission);
      });
    }
  });
}
