/**
 * Ledger for the `github-review` skill: which pull requests, issues and
 * Discussions on the repo were reviewed, and which need a review now.
 *
 * `pending [--kind pr|issue|discussion]` prints `{ pending, stale }` as JSON:
 * - `pending`: open items with outside activity (an author who is neither
 *   the authenticated `gh` user nor a bot) after their last review, or
 *   never reviewed; each row's `reason` is `new`, `new commits` or
 *   `new activity`.
 * - `stale`: open pull requests waiting on their author after a
 *   `request-changes` or `stale` verdict; `action` is `label` once the
 *   maintainer's last activity is `STALE_LABEL_DAYS` old, or `close` once a
 *   `stale`-labeled pull request's is `STALE_CLOSE_DAYS` old.
 *
 * `record --kind <kind> --number <n> --verdict <verdict>` stores a review
 * of the item's current state, stamped now.
 *
 * The ledger is `docs/github/ledger.json` in the harness directory that
 * holds this skill, resolved from this file's real path so it works when
 * `.agent` is a symlink. Exit codes: `0` ok, `1` bad arguments, `2` a `gh`
 * call failed.
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const agentDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const ledgerPath = path.join(agentDir, "docs/github/ledger.json");

export const KINDS = ["pr", "issue", "discussion"];

export const VERDICTS = {
  pr: ["approve", "request-changes", "close", "needs-maintainer", "stale"],
  issue: ["verified", "needs-repro", "cant-reproduce", "duplicate", "redirect", "close", "needs-maintainer"],
  discussion: ["answered", "accept", "ask-for-plan", "decline", "noted", "needs-maintainer"],
};

export const STALE_LABEL_DAYS = 30;
export const STALE_CLOSE_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;
const ACTOR = "login __typename";
const ACTIVITY = `createdAt author { ${ACTOR} }`;

const ITEM_FIELDS = {
  pr: `number title url createdAt lastEditedAt headRefOid author { ${ACTOR} } editor { ${ACTOR} }
    labels(first: 20) { nodes { name } }
    comments(last: 50) { nodes { ${ACTIVITY} } }
    reviews(last: 50) { nodes { submittedAt author { ${ACTOR} } } }
    reviewThreads(last: 50) { nodes { comments(last: 20) { nodes { ${ACTIVITY} } } } }`,
  issue: `number title url createdAt lastEditedAt author { ${ACTOR} } editor { ${ACTOR} }
    labels(first: 20) { nodes { name } }
    comments(last: 50) { nodes { ${ACTIVITY} } }`,
  discussion: `number title url createdAt lastEditedAt category { name } author { ${ACTOR} } editor { ${ACTOR} }
    labels(first: 20) { nodes { name } }
    comments(last: 50) { nodes { ${ACTIVITY} replies(last: 20) { nodes { ${ACTIVITY} } } } }`,
};

const CONNECTIONS = {
  pr: { list: "pullRequests(states: OPEN, first: 50, orderBy: { field: UPDATED_AT, direction: DESC })", one: "pullRequest" },
  issue: { list: "issues(states: OPEN, first: 100, orderBy: { field: UPDATED_AT, direction: DESC })", one: "issue" },
  discussion: { list: "discussions(states: [OPEN], first: 50, orderBy: { field: UPDATED_AT, direction: DESC })", one: "discussion" },
};

function latest(timestamps) {
  return timestamps.reduce((max, at) => (max === null || Date.parse(at) > Date.parse(max) ? at : max), null);
}

/**
 * Reduces one GraphQL node to the fields the ledger compares, splitting its
 * activity into outside (not the maintainer, not a bot) and the maintainer's.
 *
 * @param {object} props
 * @param {object} props.node - A pull request, issue or discussion node from the `ITEM_FIELDS` query.
 * @param {"pr" | "issue" | "discussion"} props.kind
 * @param {string} props.maintainer - Login whose activity is the maintainer's.
 * @returns {{ kind: string, number: number, title: string, url: string, author: string,
 *   isOutsideAuthor: boolean, headSha: string | null, labels: string[], category: string | null,
 *   outsideActivityAt: string | null, maintainerActivityAt: string | null }}
 */
export function summarizeActivity(props) {
  const { node, kind, maintainer } = props;
  const isOutside = (actor) => actor != null && actor.__typename !== "Bot" && actor.login !== maintainer;
  const outside = [];
  const own = [];
  const add = (actor, at) => {
    if (!actor || !at) return;
    if (isOutside(actor)) outside.push(at);
    else if (actor.login === maintainer) own.push(at);
  };

  add(node.author, node.createdAt);
  add(node.editor, node.lastEditedAt);
  for (const comment of node.comments.nodes) {
    add(comment.author, comment.createdAt);
    for (const reply of comment.replies?.nodes ?? []) add(reply.author, reply.createdAt);
  }
  for (const review of node.reviews?.nodes ?? []) add(review.author, review.submittedAt);
  for (const thread of node.reviewThreads?.nodes ?? []) {
    for (const comment of thread.comments.nodes) add(comment.author, comment.createdAt);
  }

  return {
    kind,
    number: node.number,
    title: node.title,
    url: node.url,
    author: node.author?.login ?? "ghost",
    isOutsideAuthor: isOutside(node.author),
    headSha: node.headRefOid ?? null,
    labels: node.labels.nodes.map((label) => label.name),
    category: node.category?.name ?? null,
    outsideActivityAt: latest(outside),
    maintainerActivityAt: latest(own),
  };
}

/**
 * Picks the items that need a review: never reviewed and with outside
 * activity, a pull request whose head moved, or outside activity after the
 * last review.
 *
 * @param {object} props
 * @param {ReturnType<typeof summarizeActivity>[]} props.items
 * @param {{ items: Record<string, { verdict: string, reviewedAt: string, headSha: string | null, note: string }> }} props.ledger
 * @returns {object[]} One row per pending item, with `reason`, `lastVerdict` and `note`.
 */
export function findPending(props) {
  const rows = [];
  for (const item of props.items) {
    const entry = props.ledger.items[`${item.kind}#${item.number}`];
    let reason = null;
    if (!entry) {
      if (item.outsideActivityAt) reason = "new";
    } else if (item.kind === "pr" && item.isOutsideAuthor && item.headSha !== entry.headSha) {
      reason = "new commits";
    } else if (item.outsideActivityAt && Date.parse(item.outsideActivityAt) > Date.parse(entry.reviewedAt)) {
      reason = "new activity";
    }
    if (reason) {
      rows.push({
        kind: item.kind,
        number: item.number,
        title: item.title,
        url: item.url,
        author: item.author,
        category: item.category,
        labels: item.labels,
        reason,
        lastVerdict: entry?.verdict ?? null,
        note: entry?.note ?? null,
      });
    }
  }
  return rows;
}

/**
 * Finds pull requests waiting on their author after changes were requested,
 * and the CONTRIBUTING action now due.
 *
 * @param {object} props
 * @param {ReturnType<typeof summarizeActivity>[]} props.items
 * @param {{ items: Record<string, { verdict: string, reviewedAt: string, headSha: string | null, note: string }> }} props.ledger
 * @param {number} props.now - Epoch milliseconds.
 * @returns {{ kind: "pr", number: number, title: string, url: string, action: "label" | "close", waitingDays: number, note: string }[]}
 */
export function findStale(props) {
  const rows = [];
  for (const item of props.items) {
    if (item.kind !== "pr") continue;
    const entry = props.ledger.items[`pr#${item.number}`];
    if (!entry || !["request-changes", "stale"].includes(entry.verdict)) continue;
    if (!item.maintainerActivityAt) continue;
    if (item.outsideActivityAt && Date.parse(item.outsideActivityAt) > Date.parse(item.maintainerActivityAt)) continue;
    const waitingDays = Math.floor((props.now - Date.parse(item.maintainerActivityAt)) / DAY_MS);
    const isLabeled = item.labels.includes("stale");
    const action = isLabeled
      ? waitingDays >= STALE_CLOSE_DAYS ? "close" : null
      : waitingDays >= STALE_LABEL_DAYS ? "label" : null;
    if (action) {
      rows.push({ kind: "pr", number: item.number, title: item.title, url: item.url, action, waitingDays, note: entry.note });
    }
  }
  return rows;
}

function gh(args) {
  try {
    return execFileSync("gh", args, { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (error) {
    const detail = error.code === "ENOENT" ? "gh is not installed" : error.stderr?.toString().trim() || error.message;
    process.stderr.write(`ledger: gh ${args.slice(0, 2).join(" ")} failed — ${detail}\n`);
    process.exit(2);
  }
}

function graphql(props) {
  const args = ["api", "graphql", "-f", `query=${props.query}`];
  for (const [key, value] of Object.entries(props.variables)) args.push("-F", `${key}=${value}`);
  return JSON.parse(gh(args)).data.repository;
}

function repoContext() {
  const nameWithOwner =
    process.env.GITHUB_REPOSITORY ?? JSON.parse(gh(["repo", "view", "--json", "nameWithOwner"])).nameWithOwner;
  const [owner, name] = nameWithOwner.split("/");
  const maintainer = gh(["api", "user", "--jq", ".login"]).trim();
  return { owner, name, maintainer };
}

function readLedger() {
  if (!fs.existsSync(ledgerPath)) return { version: 1, items: {} };
  return JSON.parse(fs.readFileSync(ledgerPath, "utf-8"));
}

function writeLedger(ledger) {
  fs.mkdirSync(path.dirname(ledgerPath), { recursive: true });
  fs.writeFileSync(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`);
}

function fail(message) {
  process.stderr.write(`ledger: ${message}\n`);
  process.exit(1);
}

function listOpenItems(props) {
  const { repo, kinds } = props;
  const query = `query($owner: String!, $name: String!) { repository(owner: $owner, name: $name) {
    ${kinds.map((kind) => `${kind}: ${CONNECTIONS[kind].list} { pageInfo { hasNextPage } nodes { ${ITEM_FIELDS[kind]} } }`).join("\n")}
  } }`;
  const data = graphql({ query, variables: { owner: repo.owner, name: repo.name } });
  return kinds.flatMap((kind) => {
    if (data[kind].pageInfo.hasNextPage) {
      process.stderr.write(`ledger: more open ${kind} items than one page; only the most recently updated are listed\n`);
    }
    return data[kind].nodes.map((node) => summarizeActivity({ node, kind, maintainer: repo.maintainer }));
  });
}

function pending(argv) {
  const { values } = parseArgs({ args: argv, options: { kind: { type: "string" } } });
  if (values.kind && !KINDS.includes(values.kind)) fail(`--kind must be one of ${KINDS.join(", ")}`);
  const kinds = values.kind ? [values.kind] : KINDS;
  const repo = repoContext();
  const items = listOpenItems({ repo, kinds });
  const ledger = readLedger();
  const result = { pending: findPending({ items, ledger }), stale: findStale({ items, ledger, now: Date.now() }) };
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

function record(argv) {
  const { values } = parseArgs({
    args: argv,
    options: { kind: { type: "string" }, number: { type: "string" }, verdict: { type: "string" } },
  });
  const { kind, verdict } = values;
  const number = Number(values.number);
  if (!KINDS.includes(kind)) fail(`--kind must be one of ${KINDS.join(", ")}`);
  if (!Number.isInteger(number) || number <= 0) fail("--number must be a positive integer");
  if (!VERDICTS[kind].includes(verdict)) fail(`--verdict for ${kind} must be one of ${VERDICTS[kind].join(", ")}`);

  const repo = repoContext();
  const query = `query($owner: String!, $name: String!, $number: Int!) { repository(owner: $owner, name: $name) {
    item: ${CONNECTIONS[kind].one}(number: $number) { ${ITEM_FIELDS[kind]} }
  } }`;
  const node = graphql({ query, variables: { owner: repo.owner, name: repo.name, number } }).item;
  if (!node) fail(`${kind} #${number} not found`);

  const note = `docs/github/reviews/${kind}-${number}.md`;
  const ledger = readLedger();
  ledger.items[`${kind}#${number}`] = {
    kind,
    number,
    title: node.title,
    verdict,
    reviewedAt: new Date().toISOString(),
    headSha: node.headRefOid ?? null,
    note,
  };
  writeLedger(ledger);
  process.stdout.write(`ledger: recorded ${kind} #${number} as ${verdict} (${note})\n`);
}

function main() {
  const [command, ...argv] = process.argv.slice(2);
  if (command === "pending") pending(argv);
  else if (command === "record") record(argv);
  else fail("usage: ledger.mjs pending [--kind pr|issue|discussion] | record --kind <kind> --number <n> --verdict <verdict>");
}

if (fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
