import { test } from "node:test";
import assert from "node:assert/strict";

import { checkRoute, initialClientParts, BETTER_AUTH_UI_PATTERN, LUCIDE_ALL_ICONS_PATTERN } from "./check-site-bundle.mjs";

function part(filename, sourcePath, size) {
  return { type: "part", route: "/", filename, source_path: sourcePath, size, compressed_size: Math.round(size / 3) };
}

function group(kind, outputs, trigger) {
  return { type: "group", route: "/", kind, outputs, trigger_module_ident: trigger, trigger_join: "joined" };
}

function mod(ident, sync = []) {
  return { type: "module", ident, path: ident, dependencies: { sync, async: [] } };
}

test("initial set is the parts of bootstrap and render_dependent group outputs, ignoring async groups", () => {
  const records = [
    group("bootstrap", ["[client-fs]/_next/static/chunks/a.js"], "entry"),
    group("async", ["[client-fs]/_next/static/chunks/lazy.js"], "entry"),
    part("[client-fs]/_next/static/chunks/a.js", "src/eager.ts", 1000),
    part("[client-fs]/_next/static/chunks/lazy.js", "src/lazy.ts", 5000),
  ];
  const parts = initialClientParts({ records });
  assert.deepEqual(
    parts.map((p) => p.source_path),
    ["src/eager.ts"],
  );
});

test("a module bundled into two initial outputs is counted once, by source_path", () => {
  const records = [
    group("bootstrap", ["[client-fs]/_next/static/chunks/a.js"], "entry"),
    group("render_dependent", ["[client-fs]/_next/static/chunks/b.js"], "entry"),
    part("[client-fs]/_next/static/chunks/a.js", "src/shared.ts", 1000),
    part("[client-fs]/_next/static/chunks/b.js", "src/shared.ts", 1000),
    part("[client-fs]/_next/static/chunks/b.js", "src/other.ts", 500),
  ];
  const { totalKb } = checkRoute({ records, route: "/", budgetKb: null, denyList: [] });
  assert.equal(totalKb, 1500 / 1024);
});

test("a deny-listed import reachable from the route is reported with its chain", () => {
  const records = [
    group("render_dependent", ["[client-fs]/_next/static/chunks/a.js"], "app/entry.tsx [app-client] (ecmascript)"),
    part("[client-fs]/_next/static/chunks/a.js", "packages/react/src/ui/data-table/DataTable.tsx", 2000),
    mod("app/entry.tsx [app-client] (ecmascript)", ["packages/react/src/index.ts [app-client] (ecmascript)"]),
    mod("packages/react/src/index.ts [app-client] (ecmascript)", [
      "packages/react/src/ui/data-table/DataTable.tsx [app-client] (ecmascript)",
    ]),
    mod("packages/react/src/ui/data-table/DataTable.tsx [app-client] (ecmascript)", []),
  ];
  const { violations } = checkRoute({
    records,
    route: "/",
    budgetKb: 999,
    denyList: [/ui\/data-table/],
  });
  assert.equal(violations.length, 1);
  assert.match(violations[0], /deny-listed import reachable/);
  assert.match(
    violations[0],
    /app\/entry\.tsx → packages\/react\/src\/index\.ts → packages\/react\/src\/ui\/data-table\/DataTable\.tsx/,
  );
});

test("exceeding the route budget is reported", () => {
  const records = [
    group("bootstrap", ["[client-fs]/_next/static/chunks/a.js"], "entry"),
    part("[client-fs]/_next/static/chunks/a.js", "src/big.ts", 200 * 1024),
  ];
  const { totalKb, violations } = checkRoute({ records, route: "/", budgetKb: 100, denyList: [] });
  assert.equal(totalKb, 200);
  assert.equal(violations.length, 1);
  assert.match(violations[0], /initial client JS is 200\.0KB, budget is 100KB/);
});

test("staying under budget with no deny hits reports no violations", () => {
  const records = [
    group("bootstrap", ["[client-fs]/_next/static/chunks/a.js"], "entry"),
    part("[client-fs]/_next/static/chunks/a.js", "src/small.ts", 10 * 1024),
  ];
  const { violations } = checkRoute({ records, route: "/", budgetKb: 100, denyList: [] });
  assert.deepEqual(violations, []);
});

test("better-auth-ui is exempt on the /auth route but denied elsewhere", () => {
  const records = [
    group("render_dependent", ["[client-fs]/_next/static/chunks/a.js"], "entry"),
    part("[client-fs]/_next/static/chunks/a.js", "node_modules/@daveyplate/better-auth-ui/dist/index.js", 1000),
    mod("entry", []),
  ];
  const onAuthRoute = checkRoute({
    records: records.map((r) => (r.route ? { ...r, route: "/auth/[pathname]" } : r)),
    route: "/auth/[pathname]",
    budgetKb: 999,
    denyList: [],
  });
  assert.deepEqual(onAuthRoute.violations, []);

  const onHomeRoute = checkRoute({
    records,
    route: "/",
    budgetKb: 999,
    denyList: [BETTER_AUTH_UI_PATTERN],
  });
  assert.equal(onHomeRoute.violations.length, 1);
  assert.match(onHomeRoute.violations[0], /better-auth-ui/);
});

test("many distinct legitimate static icon imports stay under the lucide fan-out heuristic", () => {
  const records = [
    group("bootstrap", ["[client-fs]/_next/static/chunks/a.js"], "entry"),
    ...Array.from({ length: 150 }, (_, i) =>
      part("[client-fs]/_next/static/chunks/a.js", `node_modules/lucide-react/dist/esm/icons/icon-${i}.js`, 300),
    ),
  ];
  const { violations } = checkRoute({ records, route: "/", budgetKb: 999, denyList: [LUCIDE_ALL_ICONS_PATTERN] });
  assert.deepEqual(violations, []);
});

test("an icons[name] lookup that bundles the whole icon set trips the lucide fan-out heuristic", () => {
  const records = [
    group("bootstrap", ["[client-fs]/_next/static/chunks/a.js"], "entry"),
    ...Array.from({ length: 250 }, (_, i) =>
      part("[client-fs]/_next/static/chunks/a.js", `node_modules/lucide-react/dist/esm/icons/icon-${i}.js`, 300),
    ),
  ];
  const { violations } = checkRoute({ records, route: "/", budgetKb: 999, denyList: [LUCIDE_ALL_ICONS_PATTERN] });
  assert.equal(violations.length, 1);
  assert.match(violations[0], /250 lucide-react icon modules/);
});

test("an enforced route the analyzer export never mentions fails instead of passing at 0 KB", () => {
  const { totalKb, violations } = checkRoute({ records: [], route: "/[slug]", budgetKb: 999, denyList: [] });
  assert.equal(totalKb, 0);
  assert.equal(violations.length, 1);
  assert.match(violations[0], /no client parts/);
});

test("report mode (no budget) tolerates an empty route", () => {
  const { violations } = checkRoute({ records: [], route: "/[slug]", budgetKb: null, denyList: [] });
  assert.deepEqual(violations, []);
});
