export { createVexRevalidateRoute } from "./createVexRevalidateRoute";
export type { CreateVexRevalidateRouteProps } from "./createVexRevalidateRoute";
export { createVexServerClient } from "./createVexServerClient";
// The wire contract types (`VexRevalidateChange`, `VexRevalidateRequest`,
// `VexRevalidateResponse`, and the two request variants) are deliberately
// absent: they are declared in `@vexcms/core`, the lowest package both this
// one and `@vexcms/react` depend on, so both ends of the wire read one
// declaration from one source (P-010). Consumers import them from
// `@vexcms/core`.
export type {
  VexServerClientOptions,
  VexServerClient,
} from "./types";
