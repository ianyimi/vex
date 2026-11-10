import { test } from "node:test";
import assert from "node:assert/strict";

import { findPending, findStale, summarizeActivity } from "./ledger.mjs";

const MAINTAINER = "ianyimi";
const DAY_MS = 24 * 60 * 60 * 1000;
const user = (login) => ({ login, __typename: "User" });
const bot = (login) => ({ login, __typename: "Bot" });

function issueNode(overrides) {
  return {
    number: 55,
    title: "Collapse duplicate exported types",
    url: "https://github.com/ianyimi/vex/issues/55",
    createdAt: "2026-11-08T02:00:00Z",
    lastEditedAt: null,
    author: user(MAINTAINER),
    editor: null,
    labels: { nodes: [{ name: "good first issue" }] },
    comments: { nodes: [] },
    ...overrides,
  };
}

function prNode(overrides) {
  return {
    number: 71,
    title: "Render AdminNotFound at the six remaining not-found call sites",
    url: "https://github.com/ianyimi/vex/pull/71",
    createdAt: "2026-11-08T12:42:16Z",
    lastEditedAt: null,
    headRefOid: "aaa111",
    author: user("jay23606"),
    editor: null,
    labels: { nodes: [] },
    comments: { nodes: [] },
    reviews: { nodes: [] },
    reviewThreads: { nodes: [] },
    ...overrides,
  };
}

const summarize = (node, kind) => summarizeActivity({ node, kind, maintainer: MAINTAINER });

test("a claim comment on a maintainer-authored issue is outside activity; bot comments are ignored", () => {
  const item = summarize(
    issueNode({
      comments: {
        nodes: [
          { createdAt: "2026-11-09T10:00:00Z", author: user("jay23606") },
          { createdAt: "2026-11-09T11:00:00Z", author: bot("vercel") },
        ],
      },
    }),
    "issue",
  );
  assert.equal(item.isOutsideAuthor, false);
  assert.equal(item.outsideActivityAt, "2026-11-09T10:00:00Z");
  assert.equal(item.maintainerActivityAt, "2026-11-08T02:00:00Z");
});

test("an unreviewed item is pending only when it has outside activity", () => {
  const quiet = summarize(issueNode({}), "issue");
  const claimed = summarize(
    issueNode({ number: 56, comments: { nodes: [{ createdAt: "2026-11-09T10:00:00Z", author: user("jay23606") }] } }),
    "issue",
  );
  const rows = findPending({ items: [quiet, claimed], ledger: { items: {} } });
  assert.deepEqual(rows.map((row) => [row.number, row.reason]), [[56, "new"]]);
});

test("a reviewed pull request is pending again after new commits or an outside review-thread reply, not after the maintainer's own comment", () => {
  const ledger = {
    items: {
      "pr#71": { verdict: "request-changes", reviewedAt: "2026-11-09T00:00:00Z", headSha: "aaa111", note: "docs/github/reviews/pr-71.md" },
      "pr#72": { verdict: "request-changes", reviewedAt: "2026-11-09T00:00:00Z", headSha: "bbb222", note: "docs/github/reviews/pr-72.md" },
      "pr#73": { verdict: "request-changes", reviewedAt: "2026-11-09T00:00:00Z", headSha: "ccc333", note: "docs/github/reviews/pr-73.md" },
    },
  };
  const moved = summarize(prNode({ headRefOid: "aaa999" }), "pr");
  const replied = summarize(
    prNode({
      number: 72,
      headRefOid: "bbb222",
      reviewThreads: { nodes: [{ comments: { nodes: [{ createdAt: "2026-11-09T05:00:00Z", author: user("jay23606") }] } }] },
    }),
    "pr",
  );
  const maintainerOnly = summarize(
    prNode({
      number: 73,
      headRefOid: "ccc333",
      comments: { nodes: [{ createdAt: "2026-11-09T06:00:00Z", author: user(MAINTAINER) }] },
    }),
    "pr",
  );
  const rows = findPending({ items: [moved, replied, maintainerOnly], ledger });
  assert.deepEqual(rows.map((row) => [row.number, row.reason, row.lastVerdict]), [
    [71, "new commits", "request-changes"],
    [72, "new activity", "request-changes"],
  ]);
});

test("stale: label after 30 days of maintainer-last silence, close 14 days after the stale comment, nothing once the author replies", () => {
  const now = Date.parse("2026-12-20T00:00:00Z");
  const daysAgo = (days) => new Date(now - days * DAY_MS).toISOString();
  const entry = (number, verdict) => ({
    verdict,
    reviewedAt: "2026-11-01T00:00:00Z",
    headSha: "aaa111",
    note: `docs/github/reviews/pr-${number}.md`,
  });
  const ledger = {
    items: {
      "pr#1": entry(1, "request-changes"),
      "pr#2": entry(2, "request-changes"),
      "pr#3": entry(3, "stale"),
      "pr#4": entry(4, "stale"),
      "pr#5": entry(5, "request-changes"),
      "pr#6": entry(6, "approve"),
    },
  };
  const waiting = (number, days, overrides = {}) =>
    summarize(
      prNode({
        number,
        createdAt: "2026-10-01T00:00:00Z",
        reviews: { nodes: [{ submittedAt: daysAgo(days), author: user(MAINTAINER) }] },
        ...overrides,
      }),
      "pr",
    );
  const items = [
    waiting(1, 31),
    waiting(2, 29),
    waiting(3, 15, { labels: { nodes: [{ name: "stale" }] } }),
    waiting(4, 13, { labels: { nodes: [{ name: "stale" }] } }),
    waiting(5, 40, { comments: { nodes: [{ createdAt: daysAgo(2), author: user("jay23606") }] } }),
    waiting(6, 60),
  ];
  const rows = findStale({ items, ledger, now });
  assert.deepEqual(rows.map((row) => [row.number, row.action, row.waitingDays]), [
    [1, "label", 31],
    [3, "close", 15],
  ]);
});
