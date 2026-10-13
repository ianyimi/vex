import type { UseSuspenseQueryOptions } from "@tanstack/react-query";
import type { FunctionReference } from "convex/server";

/**
 * Tanstack-query options as produced by `convexQuery` for a non-`"skip"` call,
 * with the result pinned to `TReturn` instead of the funcRef's baked type.
 *
 * Named deliberately: publishing this contract as `ReturnType<typeof
 * convexQuery>` instantiates the adapter's generics at their constraints and
 * collapses the query data to `any`.
 *
 * @typeParam TArgs - The endpoint's args shape.
 * @typeParam TReturn - The narrowed return type for this call.
 */
export type VexQueryOptions<TArgs extends Record<string, unknown>, TReturn> = Pick<
  UseSuspenseQueryOptions<
    TReturn,
    Error,
    TReturn,
    ["convexQuery", FunctionReference<"query", "public", TArgs, TReturn>, TArgs]
  >,
  "queryKey" | "queryFn" | "staleTime"
>;
