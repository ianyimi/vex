import { act } from "@testing-library/react";
import { configureAxe } from "vitest-axe";

/**
 * The slice of axe-core's result shape this helper reads. Declared structurally
 * rather than imported from `axe-core`: that package is only present
 * transitively (via `vitest-axe`), so importing its types from source would
 * couple this file to a hoisting detail the manifest never declares.
 */
interface AxeViolationNode {
  target: string[];
}

interface AxeViolation {
  id: string;
  help: string;
  nodes: AxeViolationNode[];
}

interface AxeRunResults {
  violations: AxeViolation[];
}

/**
 * Rules disabled for every `expectNoA11yViolations` check, keyed by the real
 * reason each is a false positive here rather than a genuine defect:
 * - `color-contrast`, `target-size`: axe needs the browser's real paint and
 *   layout engine to measure rendered colors and pixel dimensions; jsdom does
 *   neither, so both rules return "incomplete" noise instead of a result.
 *   (vitest-axe already disables every `cat.color` rule in its own
 *   `configure()` call; `color-contrast` is repeated here so the intent is
 *   greppable from this file rather than implicit in a dependency.)
 * - `region`: assumes it is auditing a full page. This helper checks isolated
 *   component fragments rendered by Testing Library, not a `<main>`-wrapped
 *   page, so "content outside a landmark" would fire on every render.
 *
 * Never widen this list without stating which real jsdom limitation the added
 * rule works around — it is not a place to silence genuine findings.
 */
const DISABLED_RULES: Record<string, { enabled: boolean }> = {
  "color-contrast": { enabled: false },
  "target-size": { enabled: false },
  region: { enabled: false },
};

/**
 * `rules` here is deliberately NOT nested under `globalOptions`: vitest-axe
 * splits its argument into `globalOptions` (forwarded to axe-core's
 * `configure()`, whose `rules` is an ARRAY of `{ id, enabled }`) and
 * everything else, which becomes per-run options merged into every call —
 * where `rules` is the object map used below.
 */
const runAxe = configureAxe({ rules: DISABLED_RULES });

/**
 * One line per violation: the axe rule id, its help text, and the offending selectors.
 *
 * @param violations - The raw axe-core violations to format.
 * @returns A newline-joined report, one line per violation.
 */
function formatViolations(violations: AxeViolation[]): string {
  return violations
    .map((violation) => {
      const targets = violation.nodes
        .map((node) => node.target.join(" "))
        .join(", ");
      return `${violation.id}: ${violation.help} — ${targets}`;
    })
    .join("\n");
}

/**
 * Runs `container` through axe-core and asserts it has zero accessibility
 * violations.
 *
 * Throws a plain `Error` rather than going through vitest-axe's
 * `toHaveNoViolations` matcher: that matcher's type augmentation resolves
 * under `tsconfig.check.json` but not under `tsconfig.build.json` (which sets
 * `customConditions: []` for declaration emit), so depending on it breaks
 * `pnpm build`. Formatting the report here keeps the helper self-contained and
 * runner-agnostic, and the message still names the failing rule id.
 *
 * @param container - Element to audit — typically Testing Library's `render()`
 *   result `container`, or `baseElement` for content mounted via a portal.
 * @param options - Optional overrides.
 * @param options.rules - Merges into (and can re-enable) the disabled defaults
 *   above, keyed by axe rule id. Passing nothing keeps the defaults: the merge
 *   is a lodash deep-merge, which skips `undefined` sources.
 * @returns Resolves when the audit is clean.
 * @throws {Error} When axe reports at least one violation, listing each rule
 *   id, its help text, and the offending element selectors.
 */
export async function expectNoA11yViolations(
  container: Element,
  options?: { rules?: Record<string, { enabled: boolean }> },
): Promise<void> {
  // Wrapped in `act`: axe's scan is asynchronous, and a component tree
  // containing a Base UI dialog (the upload picker, the blocks editor) settles
  // its portal/backdrop/popup state during that await. Outside `act` React
  // reports those as "An update to DialogRoot inside a test was not wrapped in
  // act(...)" on stderr for every a11y case of every field type that renders
  // one — noise, not a finding, since the scan already sees the settled tree.
  let results = { violations: [] } as AxeRunResults;
  await act(async () => {
    results = (await runAxe(container, { rules: options?.rules })) as AxeRunResults;
  });
  if (results.violations.length > 0) {
    throw new Error(
      `expected no accessibility violations, found ${results.violations.length}:\n${formatViolations(results.violations)}`,
    );
  }
}
