import type { ComponentType } from "react";
import type { AdminField, AdminFieldType, CellComponentProps, CollectionConfig, TDocument, VexAccessConfig } from "@vexcms/core";
import { describe, expect, it } from "vitest";
import { fieldToCellComponent, fieldToInputComponent } from "../components/fields";
import { fieldFixtures } from "./fixtures";
import type { FieldFixture } from "./fixtures/types";
import { runFieldInputContractSuite } from "./fieldInputContract";
import { runFieldCellContractSuite } from "./fieldCellContract";
import { runColumnDefSuite } from "./columnDefSuite";
import { runNestedFieldContainerSuite } from "./nestedFieldContainer";
import { renderWithVexProviders } from "./harness/accessFixtures";
import { runShellSuite, runViewSuite } from "./viewSuite";
import { runDataTableSuite } from "./dataTableSuite";
import { runModalSuite } from "./modalSuite";
import { runMediaSuite } from "./mediaSuite";
import { runHooksSuite } from "./hooksSuite";

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
 * The four field types whose Cell contract opts out of `runFieldCellContractSuite`'s
 * default truncation assertion — a fixed-format date, a number, a boolean checkbox and a
 * `#rrggbb` color swatch never render an unbounded string. Mirrors each type's own
 * `Cell.test.tsx` call (Step 5).
 */
const NO_TRUNCATION_FIELD_TYPES: ReadonlySet<AdminFieldType> = new Set([
  "date",
  "number",
  "checkbox",
  "color",
]);

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
 * The cell component shape every real field cell satisfies — the `cells` loop's
 * counterpart to `FieldInputComponent` above.
 */
type FieldCellComponent<TField extends AdminField> = ComponentType<CellComponentProps<TField, TDocument>>;

/**
 * The named groups `runVexReactSuite`'s `sections` option selects between. Each name
 * mirrors one of `2026-09-08-react-coverage-expansion`'s task groups.
 *
 * `"fields"`, `"cells"` and `"columnDefs"` are driven by the same `fieldFixtures` registry
 * `includeCore` already iterates, dispatching once per registered field type via
 * `runFieldInputContractSuite`, `runFieldCellContractSuite` and `runColumnDefSuite`
 * respectively.
 *
 * `"shell"`, `"views"`, `"dataTable"`, `"modals"`, `"media"` and `"hooks"` each dispatch
 * exactly once — no per-type loop — to a single exported suite covering their whole
 * category: `runShellSuite` (`AdminLayout`/`AdminSidebar`/`AdminTopNav`), `runViewSuite`
 * (all 8 admin views), `runDataTableSuite` (the `ui/data-table` files), `runModalSuite`
 * (the 3 modals), `runMediaSuite` (`FilePreview`/`MediaLibaryGrid`/`MediaUploadDropzone`)
 * and `runHooksSuite` (`useTableSelection`'s selection/exclusion semantics and
 * `usePaginatedQuery`'s load-more/`isDone` state derivation). `access` threads through to
 * every one of these that accepts it, so a consumer's own `VexAccessConfig` drives the real
 * RBAC-gated render paths inside its own build, not just the `shell` check below.
 * Running these against a consumer's own `@vexcms/react` build (not just inside this
 * package's own suite) is what actually catches ADR-009's dual-context/module-resolution
 * failure class — `hooks` included, since `usePaginatedQuery` resolves its queries through
 * the built `@vexcms/core` client.
 */
export type VexSuiteSection =
  | "fields"
  | "cells"
  | "columnDefs"
  | "views"
  | "shell"
  | "dataTable"
  | "modals"
  | "hooks"
  | "media";

const ALL_SECTIONS: readonly VexSuiteSection[] = [
  "fields",
  "cells",
  "columnDefs",
  "views",
  "shell",
  "dataTable",
  "modals",
  "hooks",
  "media",
];

/**
 * Runs the full `@vexcms/react` test kit — the low-ceremony entry point the
 * `./testing` subpath exists to deliver. Call at module top level inside a
 * `*.test.ts(x)` file; like every other factory in this kit it calls
 * `describe`/`it` itself.
 *
 * @param options.includeCore - Sugar that suppresses the three `fieldFixtures`-registry-driven
 *   sections (`fields`, `cells`, `columnDefs`) in one flag, independent of `sections`. When
 *   `false`, none of those three loops run even if `sections` names them — the two options
 *   combine with AND, never OR. Defaults to `true`. Does not affect `custom` (below) or any of
 *   `shell`/`views`/`dataTable`/`modals`/`media`, none of which read the `fieldFixtures`
 *   registry.
 * @param options.sections - Which named groups to run; defaults to every `VexSuiteSection`.
 *   Narrows `includeCore`'s three fixture-driven loops individually (e.g. `sections: ["cells"]`
 *   runs only the cell contract, not the input or column-def ones) and independently gates each
 *   of the five single-call suites. See {@link VexSuiteSection} for what each name dispatches.
 * @param options.custom - Project-authored fixtures paired with their own
 *   `Component`. Unlike `fieldFixtures`' entries these are never looked up via
 *   `fieldToInputComponent` — a custom field type is never registered in
 *   core's registry — so each entry's own `Component` is used directly. Each
 *   runs through the same `runFieldInputContractSuite`. Always runs, regardless of
 *   `includeCore` or `sections`: a project's own field type has no `fieldFixtures` registry
 *   entry for either option to gate on.
 * @param options.access - A real `VexAccessConfig` (typically a project's own
 *   `defineAccess()` result). `CollectionConfig` carries no `access` field of
 *   its own — RBAC is a separate, global matrix keyed by resource slug — so
 *   this cannot be threaded into the field-input loop above; instead it is
 *   proven directly against the real `VexAccessProvider` via
 *   `renderWithVexProviders`, giving a project a falsifiable check that its
 *   own access config resolves outside a hand-typed stub. Also forwarded to
 *   `runShellSuite`, `runViewSuite`, `runModalSuite` and `runMediaSuite` — each accepts
 *   `access` optionally and falls back to its own default RBAC fixtures when omitted.
 */
export function runVexReactSuite(options?: {
  includeCore?: boolean;
  sections?: VexSuiteSection[];
  custom?: Array<FieldFixture & { Component: FieldInputComponent<FieldFixture["fieldDef"]> }>;
  access?: VexAccessConfig;
}): void {
  const { includeCore = true, sections = ALL_SECTIONS, custom = [], access } = options ?? {};
  const runsCore = (section: VexSuiteSection): boolean => includeCore && sections.includes(section);

  if (sections.includes("shell")) {
    if (access) {
      describe("runVexReactSuite — access config", () => {
        it("resolves the provided VexAccessConfig inside the real VexAccessProvider", () => {
          const { container, unmount } = renderWithVexProviders(null, { access });
          expect(container).toBeTruthy();
          unmount();
        });
      });
    }
    runShellSuite({ access });
  }

  if (sections.includes("views")) {
    runViewSuite({ access });
  }

  if (sections.includes("dataTable")) {
    runDataTableSuite();
  }

  if (sections.includes("modals")) {
    runModalSuite({ access });
  }

  if (sections.includes("media")) {
    runMediaSuite({ access });
  }

  if (sections.includes("hooks")) {
    runHooksSuite();
  }

  if (runsCore("fields")) {
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

  if (runsCore("cells")) {
    for (const fieldType of Object.keys(fieldFixtures) as AdminFieldType[]) {
      const fixture = fieldFixtures[fieldType];
      if (!fixture) continue;
      const CellComponent = fieldToCellComponent(fieldType);
      if (!CellComponent) continue;
      // Boundary cast: mirrors the `fields` loop's cast above — `fieldToCellComponent`
      // returns `ComponentType<CellComponentProps<AdminField>>`, widened relative to the
      // fixture's own narrower `fieldDef` type.
      const Component = CellComponent as unknown as FieldCellComponent<typeof fixture.fieldDef>;

      runFieldCellContractSuite({
        fixture,
        Component,
        truncates: NO_TRUNCATION_FIELD_TYPES.has(fieldType) ? false : undefined,
      });
    }
  }

  if (runsCore("columnDefs")) {
    for (const fieldType of Object.keys(fieldFixtures) as AdminFieldType[]) {
      const fixture = fieldFixtures[fieldType];
      if (!fixture) continue;
      runColumnDefSuite({ fixture });
    }
  }

  for (const { Component, ...fixture } of custom) {
    runFieldInputContractSuite({ fixture, Component });
  }
}

export { runFieldInputContractSuite, getControl } from "./fieldInputContract";
export type { FieldInputContractOptions } from "./fieldInputContract";
export { runNestedFieldContainerSuite } from "./nestedFieldContainer";
export { runHooksSuite } from "./hooksSuite";
export type { HooksSuiteMember } from "./hooksSuite";
export { runRbacStateSuite } from "./rbacState";
export { fieldFixtures } from "./fixtures";
export type { FieldFixture } from "./fixtures/types";
export { installDomPolyfills } from "./setup";
export { expectNoA11yViolations } from "./a11y";
export { renderWithVexProviders, testCollection, testAccess, testUsers } from "./harness/accessFixtures";
