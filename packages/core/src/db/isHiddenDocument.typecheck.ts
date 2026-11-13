import { isHiddenDocument } from "./isHiddenDocument";
import type { HiddenDocument } from "./types";

/**
 * Compile-time pin: `isHiddenDocument`'s type predicate narrows a
 * `Doc | HiddenDocument<"images">` union BOTH ways — `true` branch narrows
 * to `HiddenDocument<"images">`, `false` branch narrows to the real,
 * CLOSED doc type (no `code`/index signature) with zero cast at the call
 * site. Before this moved to a shared, exported guard, every private
 * per-file copy was typed `value: unknown`, which narrows the `true`
 * branch fine but leaves the `false` branch as the original union —
 * `Doc | HiddenDocument` — instead of collapsing it to `Doc`.
 *
 * A CLOSED interface (no index signature) is used here rather than a
 * generated per-collection document so the `@ts-expect-error` below is
 * meaningful even inside `@vexcms/core` itself, where `vex generate`'s
 * module augmentation never applies and a generated-type fallback (an
 * open `TDocument`) would make `.code` resolve to `unknown` instead of
 * erroring.
 *
 * `pnpm typecheck` IS the assertion, no test runner involved.
 */
interface Doc {
  _id: string;
  _creationTime: number;
  title: string;
}

declare const value: Doc | HiddenDocument<"images">;

if (isHiddenDocument(value)) {
  // Narrows to HiddenDocument<"images"> — `.code` only exists on the placeholder.
  const codePin: "ACCESS_DENIED" = value.code;
  void codePin;
} else {
  // Narrows to `Doc` — `.code` does NOT exist on the real, closed doc type.
  // @ts-expect-error - `value` is narrowed to `Doc`, which has no `code` field.
  const noCodePin = value.code;
  void noCodePin;

  /** Compile-time pin value — real doc narrowing confirmed by the branch above. */
  const narrowedDocPin: Doc = value;
  void narrowedDocPin;
}
