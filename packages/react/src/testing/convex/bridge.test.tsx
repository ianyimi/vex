import "@testing-library/jest-dom";

import { ConvexQueryClient, convexQuery } from "@convex-dev/react-query";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ConvexReactClient } from "convex/react";
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";

import { createFakeConvexClient, documentsListQuery } from "./bridge";
import schema, { testModules, type TestDoc } from "./schema";

// This suite runs under `packages/react/vitest.config.ts`'s package-wide
// `environment: "jsdom"` — no `// @vitest-environment` override needed, jsdom
// is already the default here (unlike `@vexcms/core`, which mandates
// `edge-runtime`; see docs/standards/testing/convex-integration-testing.md).
//
// Residual risk, documented not eliminated: convex-test's own suite is
// exercised under an isolated `@edge-runtime/vm` sandbox upstream; running it
// here under plain Node-in-jsdom instead means any code path that happened to
// lean on a Node-only global unavailable in production Convex would silently
// pass here without that isolation catching it. Concretely checked for THIS
// file: convex-test's only Web-Crypto call (`crypto.subtle.digest`, used by
// its file-storage blob-hashing path) is never reached by the plain
// `db.insert`/`db.query().collect()` calls below, and Vitest's jsdom
// environment leaves Node's native `crypto`/`setTimeout`/`Date` untouched
// regardless (it only copies DOM-specific globals onto the test global).
//
// Two corrections verified against this repo's actual esbuild/vitest
// behavior (not assumed from the spec text): this file is `.tsx`, not
// `.ts` — a `.ts` extension makes esbuild parse it with its non-JSX `ts`
// loader, which hard-fails on the JSX below. And `convexTest(schema)` is
// called with an explicit `testModules` second argument — omitting it
// throws `(intermediate value).glob is not a function` at runtime, because
// convex-test's no-argument default is an `import.meta.glob(...)` call
// living inside its own pre-built `dist/index.js`, which Vite never
// rewrites (`schema.ts`'s `testModules` doc comment has the full trace).

function DocumentsList() {
  const { data } = useQuery(convexQuery(documentsListQuery, {}));
  const docs = (data ?? []) as TestDoc<"documents">[];
  return (
    <ul>
      {docs.map((doc) => (
        <li key={doc._id}>{doc.title}</li>
      ))}
    </ul>
  );
}

describe("createFakeConvexClient", () => {
  test("useQuery(convexQuery(...)) resolves real convex-test data through the fake client", async () => {
    const t = convexTest(schema, testModules);
    await t.run(async (ctx) => {
      await ctx.db.insert("documents", { title: "Hello from convex-test" });
    });

    const fakeClient = createFakeConvexClient(t) as ConvexReactClient;
    const convexQueryClient = new ConvexQueryClient(fakeClient);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { queryFn: convexQueryClient.queryFn(), retry: false } },
    });
    convexQueryClient.connect(queryClient);

    render(
      <QueryClientProvider client={queryClient}>
        <DocumentsList />
      </QueryClientProvider>,
    );

    expect(await screen.findByText("Hello from convex-test")).toBeInTheDocument();
  });
});
