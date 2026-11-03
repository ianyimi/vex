import { describe, expect, it } from "vitest";
import { CommitTsPlaceholder } from "convex/values";
import { commitTs } from "../fields";
import { removeVexFields } from "./removeVexFields";

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
    const result = removeVexFields({ doc });
    expect(result).toEqual({ title: "Hello", body: "World" });
  });

  it("returns the user fields unchanged when none of the stripped keys are present", () => {
    // A never-published draft with no vex_publishedId yet.
    const doc = { title: "Hello" };
    const result = removeVexFields({ doc });
    expect(result).toEqual({ title: "Hello" });
  });

  it("does not mutate the input document", () => {
    const doc = { _id: "abc", title: "Hello" };
    removeVexFields({ doc });
    expect(doc).toEqual({ _id: "abc", title: "Hello" });
  });
});

describe("removeVexFields — commitTs stripping", () => {
  it("strips a commitTs-typed field by type when fields is given", () => {
    const fields = { updatedAt: commitTs() };
    const result = removeVexFields({
      doc: { title: "Hi", updatedAt: new CommitTsPlaceholder() },
      fields,
    });
    expect(result).toEqual({ title: "Hi" });
  });

  it("does not strip commitTs fields when fields is omitted (back-compat)", () => {
    const result = removeVexFields({ doc: { title: "Hi", updatedAt: 123 } });
    expect(result).toEqual({ title: "Hi", updatedAt: 123 });
  });
});
