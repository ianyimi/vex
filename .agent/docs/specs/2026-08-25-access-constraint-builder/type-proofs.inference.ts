import type { ConstraintBuilder, ConstraintResult } from "./builder";

type PagesDoc = { authorId: string; categoryId: string; score: number };
type IndexFields = {
  by_author: readonly ["authorId"];
  by_author_category: readonly ["authorId", "categoryId"];
};

// ── TEST A: can `q` be typed from a SIBLING `name` property in one literal? ──
type IndexedRule<N extends keyof IndexFields> = {
  name: N;
  constraints: (p: { q: ConstraintBuilder<IndexFields[N], PagesDoc> }) => ConstraintResult;
};
// generic helper provides the inference site
declare function rule<N extends keyof IndexFields>(r: IndexedRule<N>): IndexedRule<N>;

const okA = rule({
  name: "by_author_category",
  constraints: ({ q }) => q.eq("authorId", "u1").eq("categoryId", "news"),
});
const badA = rule({
  name: "by_author",
  // @ts-expect-error by_author has one field — chain is spent after authorId
  constraints: ({ q }) => q.eq("authorId", "u1").eq("categoryId", "news"),
});
const orderA = rule({
  name: "by_author_category",
  // @ts-expect-error field 0 is authorId, not categoryId
  constraints: ({ q }) => q.eq("categoryId", "news"),
});

// ── TEST B: does a single signature returning boolean|ConstraintResult keep
//            contextual typing for EXISTING bare filter callbacks? ───────────
type RuleProps = { data?: PagesDoc; user: { _id: string }; q: ConstraintBuilder<IndexFields["by_author"], PagesDoc> };
type UnifiedRule = boolean | ((p: RuleProps) => boolean | ConstraintResult);

const filterStyle: UnifiedRule = ({ data, user }) => data?.authorId === user._id;
const constraintStyle: UnifiedRule = ({ q, user }) => q.eq("authorId", user._id);
// params must NOT be `any` — this proves contextual typing survived
const provesTyped: UnifiedRule = ({ user }) => {
  // @ts-expect-error _id is string, not number
  const n: number = user._id;
  return true;
};

export { okA, badA, orderA, filterStyle, constraintStyle, provesTyped };
