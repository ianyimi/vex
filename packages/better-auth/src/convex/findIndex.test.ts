import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { describe, expect, it } from "vitest";

import { findIndex } from "./utils";

/**
 * A minimal `account` table carrying the exact compound index
 * `betterAuthAdapter()` now produces for `{ accountId, providerId, userId }`
 * (`by_accountId_providerId_userId` — see
 * `../adapter.ts`'s `BETTER_AUTH_CORE_TABLE_INDEXES`), so `findIndex` is
 * exercised against the index name/shape the adapter actually resolves to.
 */
const schema = defineSchema({
  account: defineTable({
    accountId: v.string(),
    providerId: v.string(),
    userId: v.string(),
  }).index("by_accountId_providerId_userId", ["accountId", "providerId", "userId"]),
});

describe("findIndex — account compound index parity", () => {
  it("resolves accountId/providerId/userId eq where clauses to the adapter's compound index", () => {
    const result = findIndex(schema, {
      model: "account",
      where: [
        { field: "accountId", operator: "eq", value: "acc-1" },
        { field: "providerId", operator: "eq", value: "github" },
        { field: "userId", operator: "eq", value: "user-1" },
      ],
    });

    expect(result?.index?.indexDescriptor).toBe("by_accountId_providerId_userId");
    expect(result?.index?.fields).toEqual(["accountId", "providerId", "userId", "_creationTime"]);
    expect(result?.values?.eq).toEqual(["acc-1", "github", "user-1"]);
  });
});

describe("findIndex — equality plus range or sort", () => {
  const sessionSchema = defineSchema({
    session: defineTable({
      userId: v.string(),
      expiresAt: v.number(),
      token: v.string(),
    })
      .index("by_expiresAt", ["expiresAt"])
      .index("by_userId_expiresAt", ["userId", "expiresAt"]),
    user: defineTable({ email: v.string(), name: v.string() })
      .index("by_email", ["email"])
      .index("by_email_name", ["email", "name"]),
  });

  it("serves Better Auth's session listing (userId eq, expiresAt gt) from the userId-first index", () => {
    const result = findIndex(sessionSchema, {
      model: "session",
      where: [
        { field: "userId", operator: "eq", value: "user-1" },
        { field: "expiresAt", operator: "gt", value: 1 },
      ],
    });

    expect(result?.index?.indexDescriptor).toBe("by_userId_expiresAt");
    expect(result?.values?.eq).toEqual(["user-1"]);
    expect(result?.values?.gt).toBe(1);
  });

  it("serves an equality filter sorted by a second field from the compound index", () => {
    const result = findIndex(sessionSchema, {
      model: "user",
      where: [{ field: "email", operator: "eq", value: "a@example.com" }],
      sortBy: { field: "name", direction: "asc" },
    });

    expect(result?.index?.indexDescriptor).toBe("by_email_name");
  });

  it("reports the needed fields when no index starts with the equality field", () => {
    const result = findIndex(sessionSchema, {
      model: "session",
      where: [
        { field: "token", operator: "eq", value: "t" },
        { field: "expiresAt", operator: "gt", value: 1 },
      ],
    });

    expect(result?.index).toBeUndefined();
    expect(result?.indexFields).toEqual(["token", "expiresAt"]);
  });
});
