import { describe, expect, it } from "vitest";
import {
  createIndexConstraintBuilder,
  readIndexConstraints,
} from "./createIndexConstraintBuilder";

type PagesDoc = { authorId: string; categoryId: string; score: number };

/** A fresh builder over a three-field index. */
function chain() {
  return createIndexConstraintBuilder<
    readonly ["authorId", "categoryId", "score"],
    PagesDoc
  >();
}

describe("createIndexConstraintBuilder — accumulates in call order", () => {
  it("carries a single eq on the value it returns", () => {
    expect(readIndexConstraints(chain().eq("authorId", "u1"))).toEqual([
      { field: "authorId", op: "eq", value: "u1" },
    ]);
  });

  it("carries a chained sequence in call order", () => {
    const built = chain().eq("authorId", "u1").eq("categoryId", "news").gte("score", 3);
    expect(readIndexConstraints(built)).toEqual([
      { field: "authorId", op: "eq", value: "u1" },
      { field: "categoryId", op: "eq", value: "news" },
      { field: "score", op: "gte", value: 3 },
    ]);
  });

  it("records each operator with its own op literal", () => {
    const one = createIndexConstraintBuilder<readonly ["score"], PagesDoc>;
    expect(readIndexConstraints(one().gt("score", 1))).toEqual([
      { field: "score", op: "gt", value: 1 },
    ]);
    expect(readIndexConstraints(one().gte("score", 2))).toEqual([
      { field: "score", op: "gte", value: 2 },
    ]);
    expect(readIndexConstraints(one().lt("score", 9))).toEqual([
      { field: "score", op: "lt", value: 9 },
    ]);
    expect(readIndexConstraints(one().lte("score", 8))).toEqual([
      { field: "score", op: "lte", value: 8 },
    ]);
  });

  it("carries nothing when no method was called — the range callback returned the bare builder", () => {
    expect(readIndexConstraints(chain() as never)).toEqual([]);
  });
});

describe("createIndexConstraintBuilder — purity", () => {
  it("does not mutate the builder it was called on", () => {
    const start = chain();
    start.eq("authorId", "u1");
    // `start` is unchanged: the eq above produced a NEW node and was discarded.
    expect(readIndexConstraints(start as never)).toEqual([]);
  });

  it("branches independently from a shared prefix", () => {
    const prefix = chain().eq("authorId", "u1");
    const news = prefix.eq("categoryId", "news");
    const blog = prefix.eq("categoryId", "blog");

    expect(readIndexConstraints(news)).toEqual([
      { field: "authorId", op: "eq", value: "u1" },
      { field: "categoryId", op: "eq", value: "news" },
    ]);
    expect(readIndexConstraints(blog)).toEqual([
      { field: "authorId", op: "eq", value: "u1" },
      { field: "categoryId", op: "eq", value: "blog" },
    ]);
    // The shared prefix is untouched by either branch.
    expect(readIndexConstraints(prefix as never)).toHaveLength(1);
  });

  it("keeps two builders fully independent", () => {
    const a = chain().eq("authorId", "u1");
    const b = chain().eq("authorId", "u2");
    expect(readIndexConstraints(a)).toEqual([{ field: "authorId", op: "eq", value: "u1" }]);
    expect(readIndexConstraints(b)).toEqual([{ field: "authorId", op: "eq", value: "u2" }]);
  });
});

describe("readIndexConstraints — foreign values", () => {
  it("reports no constraints for a value this module did not build", () => {
    expect(readIndexConstraints({} as never)).toEqual([]);
  });
});
