// `(.)auth` — not `(...)auth` — because the interception convention keys off
// ROUTE SEGMENTS, not filesystem nesting, and slots (`@auth`) add no segment
// of their own. `@auth` sits directly under `app/`, i.e. at the app root,
// which is the SAME level as `auth/[pathname]` (under the `(frontend)` route
// group, which also adds no segment). `(.)` ("same level") is therefore both
// correct and the idiomatic choice — it's what Next's own parallel-routes
// modal example uses for a root-level slot. `(...)` ("from the app root")
// would resolve identically here only because that same level IS the root;
// `(.)` says that plainly instead of relying on the coincidence.
import AuthView from "./view"

export const dynamic = "force-dynamic"

export default async function AuthPage({ params }: { params: Promise<{ pathname: string }> }) {
  const { pathname } = await params

  return <AuthView pathname={pathname} />
}
