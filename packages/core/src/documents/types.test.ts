import { describe, expectTypeOf, it } from "vitest";
import type { TDocument, VexDocument, VexDocumentShape } from "./types";

/**
 * A hand-written stand-in for a `vex generate`d document interface —
 * `extends VexDocumentShape` (no index signature), exactly like
 * `collectionConfigToInterface`'s real output (`PostsDocument extends
 * VexDocumentShape { ... }`).
 */
interface ExampleDocument extends VexDocumentShape {
  _id: string;
  status: "draft" | "published";
  title: string;
}

describe("VexDocumentShape", () => {
  it("is closed (no index signature) — Omit keeps a field's literal union instead of widening it to unknown", () => {
    // Before this fix, every generated interface extended `VexDocument`
    // (which carries `[key: string]: unknown`), so `keyof` widened to
    // `string` and `Omit` lost per-key literal types: this resolved to
    // `unknown`, not `"draft" | "published"`.
    type OmittedStatus = Omit<ExampleDocument, "title">["status"];
    expectTypeOf<OmittedStatus>().toEqualTypeOf<"draft" | "published">();
  });

  it("AP-006: a concrete generated-shaped document stays assignable to the bare VexDocumentShape bound", () => {
    function acceptsShape<T extends VexDocumentShape>(doc: T): T {
      return doc;
    }
    const doc: ExampleDocument = { _id: "1", _creationTime: 0, status: "draft", title: "Hi" };
    expectTypeOf(acceptsShape(doc)).toEqualTypeOf<ExampleDocument>();
  });
});

describe("VexDocument — unchanged, still the permissive index-signature base", () => {
  it("still accepts a document whose field names are not statically known", () => {
    const loose: VexDocument = { _id: "1", _creationTime: 0, anything: "goes" };
    expectTypeOf(loose).toMatchTypeOf<VexDocument>();
  });

  it("TDocument (Record<string, unknown> & TShape & VexDocument) is unaffected by VexDocumentShape's introduction", () => {
    const doc: TDocument<{ title: string }> = { _id: "1", _creationTime: 0, title: "Hi" };
    expectTypeOf(doc.title).toEqualTypeOf<string>();
    // The index signature is still there — an arbitrary key resolves to `unknown`.
    expectTypeOf(doc.anyOtherKey).toEqualTypeOf<unknown>();
  });
});
