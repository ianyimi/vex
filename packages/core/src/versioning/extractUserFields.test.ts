import { describe, it, expect } from "vitest";
import { extractUserFields } from "./extractUserFields";

describe("extractUserFields", () => {
  it("strips _id and _creationTime", () => {
    const result = extractUserFields({
      document: {
        _id: "abc123",
        _creationTime: 1234567890,
        title: "Hello",
        body: "World",
      },
    });
    expect(result).toEqual({ title: "Hello", body: "World" });
  });

  it("strips version system fields", () => {
    const result = extractUserFields({
      document: {
        _id: "abc123",
        _creationTime: 1234567890,
        vex_status: "published",
        vex_version: 3,
        vex_publishedAt: 1234567890,
        title: "Hello",
        slug: "hello",
      },
    });
    expect(result).toEqual({ title: "Hello", slug: "hello" });
  });

  it("returns empty object when only system fields present", () => {
    const result = extractUserFields({
      document: {
        _id: "abc123",
        _creationTime: 1234567890,
        vex_status: "draft",
        vex_version: 1,
        vex_publishedAt: null,
      },
    });
    expect(result).toEqual({});
  });

  it("preserves fields with underscore prefix that are not system fields", () => {
    const result = extractUserFields({
      document: {
        _id: "abc123",
        _creationTime: 1234567890,
        _customField: "keep me",
        title: "Hello",
      },
    });
    expect(result).toEqual({ _customField: "keep me", title: "Hello" });
  });

  it("preserves null and undefined values in user fields", () => {
    const result = extractUserFields({
      document: {
        _id: "abc123",
        _creationTime: 1234567890,
        title: "Hello",
        subtitle: null,
        tags: undefined,
      },
    });
    expect(result).toEqual({ title: "Hello", subtitle: null, tags: undefined });
  });
});
