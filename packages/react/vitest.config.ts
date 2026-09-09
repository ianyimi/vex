import { coverageConfigDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    // Installs jest-dom's matchers and the jsdom polyfills the shared test kit
    // needs. Same module consumers point their own `setupFiles` at.
    setupFiles: ["./src/testing/setup.ts"],
    passWithNoTests: true,
    coverage: {
      enabled: true,
      // `json-summary` feeds the coverage-policy CI gate (reads
      // coverage/coverage-summary.json's `total.statements.pct`); keep
      // alongside the human-readable `text` reporter.
      reporter: ["text", "json-summary"],
      // `exclude` REPLACES vitest's defaults unless they're spread back in
      // (docs.vitest.dev/guide/coverage#coverage-setup) — do not drop this.
      //
      // Per .agent/docs/standards/testing/coverage-policy.md: only files
      // vendored VERBATIM from a named upstream may be listed here. Every
      // entry below cites its upstream. Any local hand-modification to one
      // of these files returns it to the denominator (remove its line).
      // button.tsx and input.tsx are @wds-registry primitives too but are
      // NOT listed — both received local isPending/icon-slot feature
      // commits after vendoring, so they stay in the denominator.
      exclude: [
        ...coverageConfigDefaults.exclude,
        // shadcn CLI registry primitives (components.json → registries.@wds:
        // "https://wds-shadcn-registry.netlify.app/r/{name}.json"), built on
        // @base-ui/react. Untouched since `shadcn add` — verified via
        // `git log --follow -p` per file, no header comment exists for
        // these (unlike datetime/** below).
        "src/components/ui/alert-dialog.tsx", // .../r/alert-dialog.json
        "src/components/ui/badge.tsx", // .../r/badge.json
        "src/components/ui/card.tsx", // .../r/card.json
        "src/components/ui/checkbox.tsx", // .../r/checkbox.json
        "src/components/ui/command.tsx", // .../r/command.json
        "src/components/ui/dialog.tsx", // .../r/dialog.json
        "src/components/ui/dropdown-menu.tsx", // .../r/dropdown-menu.json
        "src/components/ui/input-group.tsx", // .../r/input-group.json
        "src/components/ui/label.tsx", // .../r/label.json
        "src/components/ui/pagination.tsx", // .../r/pagination.json
        "src/components/ui/popover.tsx", // .../r/popover.json
        "src/components/ui/scroll-area.tsx", // .../r/scroll-area.json
        "src/components/ui/select.tsx", // .../r/select.json
        "src/components/ui/separator.tsx", // .../r/separator.json
        "src/components/ui/sheet.tsx", // .../r/sheet.json
        "src/components/ui/sidebar.tsx", // .../r/sidebar.json
        "src/components/ui/skeleton.tsx", // .../r/skeleton.json
        "src/components/ui/table.tsx", // .../r/table.json
        "src/components/ui/tabs.tsx", // .../r/tabs.json
        "src/components/ui/textarea.tsx", // .../r/textarea.json
        "src/components/ui/tooltip.tsx", // .../r/tooltip.json
        // Hand-vendored (not via the shadcn CLI): copied from
        // https://github.com/huybuidac/shadcn-datetime-picker per the
        // header comment in each file under this directory.
        "src/components/ui/datetime/**",
      ],
      // `statements: 80` is the interview-decided target for this package and is
      // fixed. The other three are MEASURED, never guessed (AP-012): run
      // `pnpm --filter @vexcms/react exec vitest run --coverage --coverage.reportOnFailure`
      // and take `Math.floor` of each `coverage-summary.json#total.<metric>.pct`
      // — measured 90.71 / 80.46 / 89.87 / 91.5 at the commit that added this gate.
      // `reportOnFailure` is required for the check to run at all: this suite ships
      // red on purpose (see the spec's recorded findings), and vitest skips coverage
      // reporting — and thus the thresholds — on a failing run without it.
      reportOnFailure: true,
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 89,
        lines: 91,
      },
    },
  },
});
