import type { ComponentType } from "react";
import type { AdminFieldType, CollectionConfig, VexAccessConfig } from "@vexcms/core";
import { describe, expect, it } from "vitest";
import { fieldToInputComponent } from "../components/fields";
import { fieldFixtures } from "./fixtures";
import type { FieldFixture } from "./fixtures/types";
import { runFieldInputContractSuite } from "./fieldInputContract";
import { runNestedFieldContainerSuite } from "./nestedFieldContainer";
import { renderWithVexProviders } from "./harness/accessFixtures";

/**
 * The three field types that nest arbitrary child field types instead of
 * holding a primitive value — the only entries in `fieldFixtures` that also
 * need `runNestedFieldContainerSuite`, not just `runFieldInputContractSuite`.
 */
const CONTAINER_FIELD_TYPES: ReadonlySet<AdminFieldType> = new Set(["array", "group", "blocks"]);

function isContainerFieldType(fieldType: AdminFieldType): fieldType is "array" | "group" | "blocks" {
  return CONTAINER_FIELD_TYPES.has(fieldType);
}

/**
 * A representative subset of `fieldFixtures`' keys — one from each category
 * (simple, choice, temporal, network, nested-of-nested) — used as every
 * container's `childFieldTypes` here. Mirrors the exact subset convention the
 * container fields' own `Input.test.tsx` files use (step 12): re-running all
 * 12 registered types as a nested child on every container would duplicate
 * coverage `runFieldInputContractSuite` already gives each type standalone.
 */
const CONTAINER_CHILD_FIELD_TYPES: AdminFieldType[] = ["text", "select", "date", "upload", "array"];

/**
 * The field input component shape every real field input satisfies (see
 * `FieldInputContractOptions.Component`'s doc comment for why this is not
 * `InputComponentProps<BaseFieldMeta, TField>`). Named here so
 * `runVexReactSuite`'s `custom` option never resorts to `any`.
 */
type FieldInputComponent<TField> = ComponentType<{
  name: string;
  fieldDef: TField;
  readOnly: boolean;
  collection: CollectionConfig;
  index?: number;
}>;

/**
 * Runs the full `@vexcms/react` test kit — the low-ceremony entry point the
 * `./testing` subpath exists to deliver. Call at module top level inside a
 * `*.test.ts(x)` file; like every other factory in this kit it calls
 * `describe`/`it` itself.
 *
 * @param options.includeCore - When not `false` (the default), runs
 *   `runFieldInputContractSuite` for every entry in `fieldFixtures` against
 *   its registered `fieldToInputComponent`, plus `runNestedFieldContainerSuite`
 *   for the three container types (`array`, `group`, `blocks`) over
 *   `CONTAINER_CHILD_FIELD_TYPES`.
 * @param options.custom - Project-authored fixtures paired with their own
 *   `Component`. Unlike `fieldFixtures`' entries these are never looked up via
 *   `fieldToInputComponent` — a custom field type is never registered in
 *   core's registry — so each entry's own `Component` is used directly. Each
 *   runs through the same `runFieldInputContractSuite`.
 * @param options.access - A real `VexAccessConfig` (typically a project's own
 *   `defineAccess()` result). `CollectionConfig` carries no `access` field of
 *   its own — RBAC is a separate, global matrix keyed by resource slug — so
 *   this cannot be threaded into the field-input loop above; instead it is
 *   proven directly against the real `VexAccessProvider` via
 *   `renderWithVexProviders`, giving a project a falsifiable check that its
 *   own access config resolves outside a hand-typed stub.
 */
export function runVexReactSuite(options?: {
  includeCore?: boolean;
  custom?: Array<FieldFixture & { Component: FieldInputComponent<FieldFixture["fieldDef"]> }>;
  access?: VexAccessConfig;
}): void {
  const { includeCore = true, custom = [], access } = options ?? {};

  if (access) {
    describe("runVexReactSuite — access config", () => {
      it("resolves the provided VexAccessConfig inside the real VexAccessProvider", () => {
        const { container, unmount } = renderWithVexProviders(null, { access });
        expect(container).toBeTruthy();
        unmount();
      });
    });
  }

  if (includeCore) {
    for (const fieldType of Object.keys(fieldFixtures) as AdminFieldType[]) {
      const fixture = fieldFixtures[fieldType];
      if (!fixture) continue;
      const InputComponent = fieldToInputComponent(fieldType);
      if (!InputComponent) continue;
      // Boundary cast: `fieldToInputComponent` returns
      // `ComponentType<InputComponentProps<BaseFieldMeta, AdminField>>`, whose
      // `collection` prop is `CollectionConfig | GlobalConfig`. Comparing
      // `ComponentType`s checks `defaultProps` covariantly, which rejects that
      // wider union against `FieldInputComponent`'s narrower `CollectionConfig`-only
      // prop — the same boundary `nestedFieldContainer.ts` documents and casts.
      const Component = InputComponent as unknown as FieldInputComponent<typeof fixture.fieldDef>;

      runFieldInputContractSuite({ fixture, Component });

      if (isContainerFieldType(fieldType)) {
        runNestedFieldContainerSuite({
          container: fieldType,
          Component,
          childFieldTypes: CONTAINER_CHILD_FIELD_TYPES,
        });
      }
    }
  }

  for (const { Component, ...fixture } of custom) {
    runFieldInputContractSuite({ fixture, Component });
  }
}

export { runFieldInputContractSuite, getControl } from "./fieldInputContract";
export type { FieldInputContractOptions } from "./fieldInputContract";
export { runNestedFieldContainerSuite } from "./nestedFieldContainer";
export { runRbacStateSuite } from "./rbacState";
export { fieldFixtures } from "./fixtures";
export type { FieldFixture } from "./fixtures/types";
export { installDomPolyfills } from "./setup";
export { expectNoA11yViolations } from "./a11y";
export { renderWithVexProviders, testCollection, testAccess, testUsers } from "./harness/accessFixtures";
