---
applies_to: ["packages/react/src/**", "apps/test/src/**"]
---
# Data Fetching (Convex + TanStack Query)

- Primary pattern: `convexQuery(vexConvexApi.get, args)` from `@convex-dev/react-query`,
  spread into `useQuery` — returns a live WebSocket subscription
  (`packages/react/src/components/AdminTopNav.tsx:8-31`).
- `ConvexReactClient`, `ConvexQueryClient`, and `QueryClient` MUST be module-level
  singletons; `convexQueryClient.connect(queryClient)` MUST run synchronously at module
  load. Connecting in `useEffect` creates a window where first-render queries miss the
  "added" event and never subscribe — mutations update the DB but the UI doesn't react.
- isMounted hydration guard: any cell/component reading Convex subscription data renders a
  fixed placeholder (`—`) during SSR + initial hydration render:
  `const [isMounted, setIsMounted] = useState(false); useEffect(() => setIsMounted(true), []);`
  (`packages/react/src/components/fields/relationship/Cell.tsx:36-46`). Convex can push
  data into the TanStack cache synchronously during hydration → systematic mismatch without it.
- Cursor pagination via `usePaginatedQuery` (`packages/react/src/hooks/usePaginatedQuery.ts`),
  which accumulates results and manages the cursor for load-more UIs.
- Generic hooks (debounce, media query, local storage…) come from `@ts-hooks-kit/core`;
  only write custom hooks in `packages/react/src/hooks/` when they carry vexcms domain
  logic. Library peer ranges must not narrow `@vexcms/*`'s `react: ">=18.0.0"` peer range.
