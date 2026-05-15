import { describe, it, expect } from "vitest";
import { mergeAuthCollections } from "./mergeCollections";
import { defineCollection } from "..";
import { text, checkbox, date } from "../fields";
import type { AuthCollectionMeta } from "..";
import type { AuthFieldMeta } from "./mergeCollections";

describe("mergeAuthCollections", () => {
  const authUser = defineCollection<AuthFieldMeta, AuthCollectionMeta>({
    slug: "user",
    fields: {
      email: text({ meta: { locked: true } }),
      name: text(),
      emailVerified: checkbox({ meta: { locked: true } }),
    },
  });

  const authSession = defineCollection<AuthFieldMeta, AuthCollectionMeta>({
    slug: "session",
    fields: {
      token: text({ meta: { locked: true } }),
      userId: text({ meta: { locked: true } }),
      expiresAt: date({ meta: { locked: true } }),
    },
    meta: { protected: true },
  });

  it("merges user-defined fields into user collection", () => {
    const userCol = defineCollection({
      slug: "user",
      fields: {
        name: text({ label: "Display Name" }),
        bio: text(),
        phone: text(),
      },
    });

    const result = mergeAuthCollections({
      authCollections: [authUser, authSession],
      userCollections: [userCol],
    });
    const user = result.find((c) => c.slug === "user");

    // Locked auth fields preserved
    expect(user?.fields.email).toBeDefined();
    expect(user?.fields.emailVerified).toBeDefined();

    // User fields win (override or extend)
    expect(user?.fields.name?.label).toBe("Display Name");
    expect(user?.fields.bio).toBeDefined();
    expect(user?.fields.phone).toBeDefined();
  });

  it("preserves locked auth fields even when user tries to override", () => {
    const userCol = defineCollection({
      slug: "user",
      fields: {
        email: text({ label: "User Email" }),
        name: text(),
      },
    });

    const result = mergeAuthCollections({
      authCollections: [authUser],
      userCollections: [userCol],
    });
    const user = result.find((c) => c.slug === "user");

    // Locked field preserved — user override rejected
    expect(user?.fields.email).toBeDefined();
    // @ts-expect-error invalid collectionmeta and fieldmeta types
    expect(user?.fields.email.meta?.label).not.toBe("User Email");

    // Unlocked field overridden by user
    expect(user?.fields.name).toBeDefined();
  });

  it("rejects user collections that override protected auth slugs", () => {
    const sessionCol = defineCollection({
      slug: "session",
      fields: { token: text() },
    });

    expect(() =>
      mergeAuthCollections({
        authCollections: [authSession],
        userCollections: [sessionCol],
      }),
    ).toThrow(/protected by the auth adapter/);
  });

  it("appends unmatched auth collections at the end", () => {
    const userCol = defineCollection({
      slug: "user",
      fields: { name: text() },
    });

    const result = mergeAuthCollections({
      authCollections: [authUser, authSession],
      userCollections: [userCol],
    });
    const slugs = result.map((c) => c.slug);
    expect(slugs).toEqual(["user", "session"]);
  });

  it("leaves user-only collections untouched", () => {
    const postCol = defineCollection({
      slug: "posts",
      fields: { title: text() },
    });

    const result = mergeAuthCollections({
      authCollections: [authUser],
      userCollections: [postCol],
    });
    expect(result.find((c) => c.slug === "posts")).toBeDefined();
  });

  it("strips protected flag from merged collections", () => {
    const result = mergeAuthCollections({
      authCollections: [authSession],
      userCollections: [],
    });
    const session = result.find((c) => c.slug === "session");
    // @ts-expect-error testing stripped authCollectionConfig metadata
    expect(session?.protected).toBeUndefined();
  });
});
