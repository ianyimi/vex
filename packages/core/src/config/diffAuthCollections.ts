import type { AuthCollectionConfig } from "../auth/types";

/**
 * Compares the auth collections a client config declares against the ones a
 * live auth adapter produces, and describes the first divergence.
 *
 * The client config declares its auth collections by calling its auth
 * package's builder (e.g. `betterAuthCollections()` from
 * `@vexcms/better-auth/client`), which cannot see the server's real auth
 * options. `defineServerConfig` can: it holds the live adapter. This function
 * is how that advantage becomes an error message instead of an admin panel
 * quietly missing a column.
 *
 * Comparison is structural over a stable serialization — object key order
 * differs between the two construction paths, and function-valued or
 * `undefined` properties are dropped, mirroring `JSON.stringify`, because a
 * declared collection is plain data while a live one may carry callbacks that
 * never affect what the admin renders.
 *
 * @param props.declared - `config.authCollections`, as built in `vex.config.ts`.
 * @param props.live - `auth.adapter.collections`, derived from the real auth options.
 * @returns A human-readable description of the first divergence, or `null` when the two agree.
 */
export function diffAuthCollections(props: {
  declared: AuthCollectionConfig[];
  live: AuthCollectionConfig[];
}): string | null {
  const declared = new Map(props.declared.map((c) => [c.slug, c]));
  const live = new Map(props.live.map((c) => [c.slug, c]));

  const missing = [...live.keys()].filter((slug) => !declared.has(slug));
  if (missing.length > 0) {
    return `missing collection(s) ${missing.map((s) => `"${s}"`).join(", ")}`;
  }

  const extra = [...declared.keys()].filter((slug) => !live.has(slug));
  if (extra.length > 0) {
    return `declares collection(s) ${extra.map((s) => `"${s}"`).join(", ")} that the auth adapter does not produce`;
  }

  for (const [slug, liveCollection] of live) {
    const declaredCollection = declared.get(slug);
    if (declaredCollection === undefined) continue;

    const liveFields = Object.keys(liveCollection.fields).sort();
    const declaredFields = Object.keys(declaredCollection.fields).sort();

    const missingFields = liveFields.filter((f) => !declaredFields.includes(f));
    if (missingFields.length > 0) {
      return `collection "${slug}" is missing field(s) ${missingFields.map((f) => `"${f}"`).join(", ")}`;
    }
    const extraFields = declaredFields.filter((f) => !liveFields.includes(f));
    if (extraFields.length > 0) {
      return `collection "${slug}" declares field(s) ${extraFields.map((f) => `"${f}"`).join(", ")} the auth adapter does not produce`;
    }

    for (const field of liveFields) {
      const liveField = stableStringify(liveCollection.fields[field]);
      const declaredField = stableStringify(declaredCollection.fields[field]);
      if (liveField !== declaredField) {
        return `collection "${slug}" field "${field}" differs (declared ${declaredField}, adapter ${liveField})`;
      }
    }
  }

  return null;
}

/**
 * JSON-stringifies `value` with every object's keys sorted, recursively.
 * Arrays keep their order. Functions, symbols, and `undefined` are dropped
 * from objects and become `null` inside arrays, exactly as `JSON.stringify`
 * does — the two construction paths disagree on callbacks that do not affect
 * the rendered collection.
 *
 * @param value - The value to stringify.
 * @returns A JSON string with deterministic key order.
 */
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value
      .map((item) =>
        item === undefined || typeof item === "function" || typeof item === "symbol"
          ? "null"
          : stableStringify(item),
      )
      .join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const entries: string[] = [];
    for (const key of Object.keys(record).sort()) {
      const entry = record[key];
      if (entry === undefined || typeof entry === "function" || typeof entry === "symbol") continue;
      entries.push(`${JSON.stringify(key)}:${stableStringify(entry)}`);
    }
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
}
