import { describe, expect, it } from "vitest";
import { extractUserFields } from "./extractUserFields";

describe("extractUserFields", () => {
  it("strips _id, _creationTime, and every VERSION_SYSTEM_FIELDS member", () => {
    const doc = {
      _id: "abc",
      _creationTime: 1700000000000,
      title: "Hello",
      body: "World",
      vex_status: "draft",
      vex_publishedAt: 1700000001000,
      vex_publishedId: "def",
    };
    const result = extractUserFields({ doc });
    expect(result).toEqual({ title: "Hello", body: "World" });
  });

  it("returns the user fields unchanged when none of the stripped keys are present", () => {
    // A never-published draft with no vex_publishedId yet.
    const doc = { title: "Hello" };
    const result = extractUserFields({ doc });
    expect(result).toEqual({ title: "Hello" });
  });

  it("does not mutate the input document", () => {
    const doc = { _id: "abc", title: "Hello" };
    extractUserFields({ doc });
    expect(doc).toEqual({ _id: "abc", title: "Hello" });
  });
});
