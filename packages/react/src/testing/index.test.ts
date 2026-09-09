import { describe, expect, it, vi } from "vitest";

vi.mock("./fieldInputContract", () => ({ runFieldInputContractSuite: vi.fn() }));
vi.mock("./nestedFieldContainer", () => ({ runNestedFieldContainerSuite: vi.fn() }));
vi.mock("./fieldCellContract", () => ({ runFieldCellContractSuite: vi.fn() }));
vi.mock("./columnDefSuite", () => ({ runColumnDefSuite: vi.fn() }));
vi.mock("./viewSuite", () => ({ runViewSuite: vi.fn(), runShellSuite: vi.fn() }));
vi.mock("./dataTableSuite", () => ({ runDataTableSuite: vi.fn() }));
vi.mock("./modalSuite", () => ({ runModalSuite: vi.fn() }));
vi.mock("./mediaSuite", () => ({ runMediaSuite: vi.fn() }));
vi.mock("./hooksSuite", () => ({ runHooksSuite: vi.fn() }));

import { fieldFixtures } from "./fixtures";
import { runFieldInputContractSuite } from "./fieldInputContract";
import { runFieldCellContractSuite } from "./fieldCellContract";
import { runColumnDefSuite } from "./columnDefSuite";
import { runShellSuite, runViewSuite } from "./viewSuite";
import { runDataTableSuite } from "./dataTableSuite";
import { runModalSuite } from "./modalSuite";
import { runMediaSuite } from "./mediaSuite";
import { runHooksSuite } from "./hooksSuite";
import { runVexReactSuite } from "./index";

const FIELD_TYPE_COUNT = Object.keys(fieldFixtures).length;

/** Every mocked dispatch target, keyed by the `VexSuiteSection` name that triggers it. */
const DISPATCH_MOCKS = {
  fields: vi.mocked(runFieldInputContractSuite),
  cells: vi.mocked(runFieldCellContractSuite),
  columnDefs: vi.mocked(runColumnDefSuite),
  shell: vi.mocked(runShellSuite),
  views: vi.mocked(runViewSuite),
  dataTable: vi.mocked(runDataTableSuite),
  modals: vi.mocked(runModalSuite),
  media: vi.mocked(runMediaSuite),
  hooks: vi.mocked(runHooksSuite),
} as const;

type DispatchSection = keyof typeof DISPATCH_MOCKS;
const DISPATCH_SECTIONS = Object.keys(DISPATCH_MOCKS) as DispatchSection[];

/** `fields`/`cells`/`columnDefs` dispatch once per registered field type; the other six dispatch once, total, per call. */
const PER_TYPE_SECTIONS = new Set<DispatchSection>(["fields", "cells", "columnDefs"]);

/**
 * How many times one section's dispatch target should be called per
 * `runVexReactSuite` invocation that includes it.
 *
 * @param section - The section under test.
 * @returns The expected call count.
 */
function expectedCallCount(section: DispatchSection): number {
  return PER_TYPE_SECTIONS.has(section) ? FIELD_TYPE_COUNT : 1;
}

/**
 * Snapshots every dispatch mock's current call count.
 *
 * @returns Call counts keyed by section name.
 */
function callCounts(): Record<DispatchSection, number> {
  return Object.fromEntries(
    DISPATCH_SECTIONS.map((section) => [section, DISPATCH_MOCKS[section].mock.calls.length]),
  ) as Record<DispatchSection, number>;
}

describe("runVexReactSuite — sections dispatch — default (no options)", () => {
  vi.clearAllMocks();
  runVexReactSuite();
  const counts = callCounts();

  it.each(DISPATCH_SECTIONS)("dispatches %s the expected number of times", (section) => {
    expect(counts[section]).toBe(expectedCallCount(section));
  });
});

describe.each(DISPATCH_SECTIONS)('runVexReactSuite — sections dispatch — sections: ["%s"]', (onlySection) => {
  vi.clearAllMocks();
  runVexReactSuite({ sections: [onlySection] });
  const counts = callCounts();

  it(`dispatches only ${onlySection}`, () => {
    for (const section of DISPATCH_SECTIONS) {
      expect(counts[section]).toBe(section === onlySection ? expectedCallCount(section) : 0);
    }
  });
});

// `hooks` needs no bespoke block: it is a real dispatch target in
// `DISPATCH_MOCKS` above, so the generic default-dispatch and
// single-section `describe.each` blocks already cover it.

describe("runVexReactSuite — sections dispatch — includeCore: false", () => {
  vi.clearAllMocks();
  runVexReactSuite({ includeCore: false, sections: ["fields", "cells", "columnDefs"] });
  const coreCounts = {
    fields: DISPATCH_MOCKS.fields.mock.calls.length,
    cells: DISPATCH_MOCKS.cells.mock.calls.length,
    columnDefs: DISPATCH_MOCKS.columnDefs.mock.calls.length,
  };

  const textFixture = fieldFixtures.text;
  if (!textFixture) throw new Error("expected a `text` entry in fieldFixtures");
  vi.clearAllMocks();
  runVexReactSuite({ includeCore: false, custom: [{ ...textFixture, Component: () => null }] });
  const customCallCount = DISPATCH_MOCKS.fields.mock.calls.length;

  it("suppresses fields, cells and columnDefs even when `sections` names all three", () => {
    expect(coreCounts).toEqual({ fields: 0, cells: 0, columnDefs: 0 });
  });

  it("does not suppress `custom`", () => {
    expect(customCallCount).toBe(1);
  });
});
